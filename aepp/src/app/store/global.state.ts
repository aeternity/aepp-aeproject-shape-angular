import { Injectable } from '@angular/core';
// import { BehaviorSubject, Observable } from 'rxjs';
import { BehaviorSubject } from 'rxjs/internal/BehaviorSubject';
import { Observable } from 'rxjs/internal/Observable';
import { State } from '../interfaces/global.state'

@Injectable()
export class GlobalStore {

    state: State = {
        toDos: [],
        account: {},
        accountBalance: 0,
        isLoading: false
    };

    private globalStore: any = new BehaviorSubject(this.state);

    public data = new Observable((fn) => {
        this.globalStore.subscribe(fn);
    })

    constructor() {
    }

    public get getGlobalStore(): any {
        return this.globalStore.value;
    }

    public get getAllTodos() {
        return this.globalStore.value.toDos;
    }

    public get isLoading() {
        return this.globalStore.value.isLoading
    }

    public addTodo(todo) {
        this.emitAddTodos(todo)
    }

    private emitAddTodos(todo) {
        let currStore = this.globalStore.value;
        currStore.toDos.push(todo);
        this.globalStore.next(currStore)
    }

    public deleteTodo(id) {
        this.emitDeleteTodo(id)
    }

    private emitDeleteTodo(id) {
        let currStore = this.globalStore.value;
        currStore.toDos = currStore.toDos.filter(todo => todo.id !== id);;

        this.globalStore.next(currStore)
    }

    public toggleLoading() {
        this.emitToggleLoading()
    }

    private emitToggleLoading() {
        let currStore = this.globalStore.value;
        currStore.isLoading = !currStore.isLoading;

        this.globalStore.next(currStore)
    }

    public setAccount(client) {
        this.emitSetAccount(client)
    }

    private emitSetAccount(client) {
        let currStore = this.globalStore.value;
        currStore.account = client;
    }

    public setToDos(parsedToDos) {
        this.emitSetToDos(parsedToDos)
    }

    private emitSetToDos(parsedToDos) {
        let currStore = this.globalStore.value;
        currStore.toDos = [...parsedToDos];

        this.globalStore.next(currStore)
    }

    public editTodoStatus() {
        this.emietTodoStatus()
    }

    private emietTodoStatus() {
        let currStore = this.globalStore.value;
        this.globalStore.next(currStore)
    }

}