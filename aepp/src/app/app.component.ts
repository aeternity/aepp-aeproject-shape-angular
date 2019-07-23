import { Component } from '@angular/core';
import { GlobalStore } from './store/global.state'
import { State } from './interfaces/global.state'

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent {
 
  isLoading: boolean;

  constructor(public globalStore: GlobalStore) {
  }
  ngOnInit() {
    this.globalStore.data.subscribe((data: State) => {
      this.isLoading = data.isLoading
    })
  }
}
