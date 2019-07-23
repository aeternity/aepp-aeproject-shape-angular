import { Component, OnInit } from '@angular/core';
import { GlobalStore } from 'src/app/store/global.state';
import { State } from '../../interfaces/global.state';

@Component({
  selector: 'app-header',
  templateUrl: './header.component.html',
  styleUrls: ['./header.component.scss']
})
export class HeaderComponent implements OnInit {
  todos = [];

  constructor(public globalStore: GlobalStore) { 
    globalStore.data.subscribe((data : State) => {
      this.todos = data.toDos;
    })
  }

  ngOnInit() {
  }

}
