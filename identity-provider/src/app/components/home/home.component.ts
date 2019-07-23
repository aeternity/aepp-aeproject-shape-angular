import { Component, OnInit, ElementRef, ViewChild } from '@angular/core';
import Wallet from '@aeternity/aepp-sdk/es/ae/wallet';
import MemoryAccount from '@aeternity/aepp-sdk/es/account/memory'
import account from '../../account';


@Component({
  selector: 'app-home',
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.scss']
})
export class HomeComponent implements OnInit {
  @ViewChild('aepp', { static: false }) aepp: ElementRef;

    // Testnet config
    // runningInFrame: window.parent !== window,
    // pub: 'ak_6A2vcm1Sz6aqJezkLCssUXcyZTX7X8D5UwbuS2fRJr9KkYpRU', // Your public key
    // priv: 'a7a695f999b1872acb13d5b63a830a8ee060ba688a478a08c6e65dfad8a01cd70bb4ed7927f97b51e1bcb5e1340d12335b2a2b12c8bc5221d63c4bcb39d41e61', // Your private key
    // client: null,
    // balance: null,
    // height: null,
    // url: 'https://sdk-testnet.aepps.com/',
    // internalUrl: 'https://sdk-testnet.aepps.com/',
    // compilerUrl: 'https://compiler.aepps.com',
    // aeppUrl: '//0.0.0.0:8081'

    // Local config

    runningInFrame = window.parent !== window;
    pub = account.pub; // Your public key
    priv = account.priv; // Your private key
    client = null;
    balance = null;
    height = null;
    url = 'http://localhost:3001/';
    internalUrl = 'http://localhost:3001/internal/';
    compilerUrl = 'http://localhost:3080';
    aeppUrl = '//0.0.0.0:8081';
    
  constructor() { 
  }

  async ngOnInit() {
    await this.createClient();
    
    if (!this.runningInFrame) this.aepp.nativeElement.src = this.aeppUrl
    else window.parent.postMessage({ jsonrpc: '2.0', method: 'ready' }, '*')

    this.height = await this.client.height()
    this.balance = await this.client.balance(this.pub).catch(() => 0)
  }

  confirmDialog(method, params, { id }) {
    return Promise.resolve(window.confirm(`User ${id} wants to run ${method} ${params}`))
  }

  async createClient() {
    this.client = await Wallet({
      url: this.url,
      internalUrl: this.internalUrl,
      compilerUrl: this.compilerUrl,
      accounts: [MemoryAccount({ keypair: { secretKey: this.priv, publicKey: this.pub } })],
      address: this.pub,
      onTx: this.confirmDialog,
      onChain: this.confirmDialog,
      onAccount: this.confirmDialog,
      onContract: this.confirmDialog
    })
  }

}
