import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { computed } from "mobx";
import { Todo } from '../../interfaces/todo';
import { trigger, transition, style, animate } from '@angular/animations';
import { GlobalStore } from '../../store/global.state'
import { State } from '../../interfaces/global.state';
import Aepp from '@aeternity/aepp-sdk/es/ae/aepp';
import contractDetails from '../../../contractDetails';
import * as AeSDK from '@aeternity/aepp-sdk'

@Component({
  selector: 'todo-list',
  templateUrl: './todo-list.component.html',
  styleUrls: ['./todo-list.component.scss'],
  animations: [
    trigger('fade', [

      transition(':enter', [
        style({ opacity: 0, transform: 'translateY(30px)' }),
        animate(100, style({ opacity: 1, transform: 'translateY(0px)' }))
      ]),

      transition(':leave', [
        animate(100, style({ opacity: 0, transform: 'translateY(30px)' }))
      ]),

    ])
  ]
})

export class TodoListComponent implements OnInit {
  config = {
    host: "http://localhost:3001/",
    internalHost: "http://localhost:3001/internal/",
    ownerKeyPair: {
      secretKey: "bb9f0b01c8c9553cfbaf7ef81a50f977b1326801ebf7294d1c2cbccdedf27476e9bbf604e611b5460a3b3999e9771b6f60417d73ce7c5519e12f7e127a1225ca",
      publicKey: "ak_2mwRmUeYmfuW93ti9HMSUJzCk1EYcQEfikVSzgo6k2VghsWhgU"
    },
    notOwnerKeyPair: {
      secretKey: "7fa7934d142c8c1c944e1585ec700f671cbc71fb035dc9e54ee4fb880edfe8d974f58feba752ae0426ecbee3a31414d8e6b3335d64ec416f3e574e106c7e5412",
      publicKey: "ak_tWZrf8ehmY7CyB1JAoBmWJEeThwWnDpU4NadUdzxVSbzDgKjP"
    },
    filesEncoding: "utf-8",
    gas: 20000000,
    ttl: 123,
    networkId: "ae_devnet",
    abiType: "sophia"
  }
  Universal = AeSDK.Universal;
  
  disableTodos: boolean;
  runningInFrame: boolean;
  todos: Todo[];
  todoTitle: string;
  idForTodo: number;
  beforeEditCache: string;
  filter: string;
  anyRemainingModel: boolean;
  callOpts: {
    deposit: 0,
    gasPrice: 1000000000,
    amount: 0,
    fee: any, // sdk will automatically select this
    gas: 1000000,
    callData: '',
    verify: true
  };
  contractInstance: any;
  client: any;
  localClient: any;
  localContractInstance: any;

  constructor(public globalStore: GlobalStore, private cd: ChangeDetectorRef) {
    globalStore.data.subscribe((data: State) => {
      this.todos = data.toDos;
      this.disableTodos = !data.isLoading
    })
  }

  ngDoCheck() {
    this.cd.markForCheck()
  }

  async ngOnInit() {

    this.anyRemainingModel = true;
    this.filter = 'all';
    this.beforeEditCache = '';
    this.todoTitle = '';
    this.runningInFrame = window.parent !== window;
    
    this.globalStore.toggleLoading()

    await this.getClient();
    // await this.localGetClient(this.Universal, this.config, this.config.ownerKeyPair);
    await this.getContractTasks();
    
    this.globalStore.toggleLoading()
  }

  @computed get allTodos() {
    return this.globalStore.getAllTodos;
  }

  @computed get remaining(): number {
    return this.allTodos.filter(todo => !todo.isCompleted).length;
  }
 
  async addTodo() {
    this.globalStore.toggleLoading()
    try {
      if (this.todoTitle.trim().length === 0) {
        return;
      }

      this.globalStore.addTodo({
        id: this.allTodos.length > 0 ? this.allTodos.length : 0,
        title: this.todoTitle,
        completed: false,
      })

      await this.contractInstance!.call('add_todo', [this.todoTitle]);
      await this.getContractTasks();
      
      this.globalStore.toggleLoading()
      this.todoTitle = '';
      
    } catch (error) {
      this.globalStore.toggleLoading()
      console.log(error)
    }
  }

  doneEdit(todo: Todo): void {
    if (todo.title.trim().length === 0) {
      todo.title = this.beforeEditCache;
    }

    this.anyRemainingModel = this.anyRemaining();
    todo.editing = false;
  }

  cancelEdit(todo: Todo): void {
    todo.title = this.beforeEditCache;
    todo.editing = false;
  }

  onComplete(todo: Todo): void {
    if (todo.title.trim().length === 0) {
      todo.title = this.beforeEditCache;
    }
    
    this.anyRemainingModel = this.anyRemaining();
    todo.editing = false;
  }

  async toggleTaskStatus(key) {
    this.globalStore.toggleLoading()
    let todo = this.globalStore.getAllTodos.filter(todo => todo.id === key)[0]
    try {
      await this.contractInstance.call('edit_todo_state', [todo.id, todo.isCompleted]);
      this.globalStore.editTodoStatus();
      this.globalStore.toggleLoading()
    } catch (err) {
      this.globalStore.toggleLoading()
      console.log(err);
    }
  }

  async deleteTodo(key) {
    
    this.globalStore.toggleLoading()
    let todo = this.globalStore.getAllTodos.filter(todo => todo.id === key)[0]

    try {
      await this.contractInstance.call('delete_todo', [todo.id]); 
      this.globalStore.deleteTodo(key)
      this.globalStore.toggleLoading()
    } catch (err) {
      this.globalStore.toggleLoading()
      console.log(err);
    }

  }

  atLeastOneCompleted(): boolean {
    return this.todos.filter(todo => todo.isCompleted).length > 0;
  }

  clearCompleted(): void {
    this.todos = this.todos.filter(todo => !todo.isCompleted);
  }

  anyRemaining(): boolean {
    return this.remaining !== 0;
  }

  todosFiltered(): Todo[] {
    if (this.filter === 'all') {
      return this.allTodos;
    } else if (this.filter === 'active') {
      return this.allTodos.filter(todo => !todo.isCompleted);
    } else if (this.filter === 'completed') {
      return this.allTodos.filter(todo => todo.isCompleted);
    }

    return this.allTodos;
  }

  async getClient() {
    let parent = this.runningInFrame ? window.parent : await this.getReverseWindow()
    
    try {
      // Aepp approach
      this.client = await Aepp({
        parent: parent
      });
      this.globalStore.setAccount(this.client);
      this.contractInstance = await this.client.getContractInstance(contractDetails.contractSource, { contractAddress: contractDetails.contractAddress });

    } catch (err) {
      console.log(err);
    }
    
  }

  async getReverseWindow() {

    const iframe = document.createElement('iframe')
    iframe.src = prompt('Enter wallet URL', 'http://localhost:8081')
    iframe.style.display = 'none'
    document.body.appendChild(iframe)
    await new Promise(resolve => {
      const handler = ({ data }) => {
        if (data.method !== 'ready') return
        window.removeEventListener('message', handler)
        resolve()
      }
      window.addEventListener('message', handler)
    })
    return iframe.contentWindow
  }

  async getContractTasks() {

    const allToDosResponse : any = await this.contractInstance.call("get_todos", []);
    const allToDos = await allToDosResponse.decode();
    const parsedToDos = this.convertSophiaListToTodos(allToDos);

    
    this.globalStore.setToDos(parsedToDos);
  }

  convertSophiaListToTodos(data) {
    let tempCollection = [];
    let taskId;

    for (let dataIndex in data) {
      let todoInfo = data[dataIndex];

      taskId = todoInfo[0];
      let todo: any = this.convertToTODO(todoInfo[1]);
      todo.id = taskId;

      tempCollection.push(todo);
    }

    return tempCollection;
  }

  convertToTODO(data) {
    return {
      title: data.name,
      isCompleted: data.is_completed
    }
  }

}

