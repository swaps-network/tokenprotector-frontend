import { AfterContentInit, Component, EventEmitter, Injectable, OnDestroy, OnInit, Output, TemplateRef, ViewChild} from '@angular/core';
import { Location, LocationStrategy, PathLocationStrategy } from '@angular/common';
import { ActivatedRoute, ActivatedRouteSnapshot, Resolve, Router } from '@angular/router';
import { DateAdapter, MAT_DATE_FORMATS, MAT_DATE_LOCALE, MatDatepicker, MatDialog, MatDialogRef } from '@angular/material';
import { MAT_MOMENT_DATE_ADAPTER_OPTIONS, MomentDateAdapter } from '@angular/material-moment-adapter';

import { TransactionComponent } from '../transaction/transaction.component';
import { MY_FORMATS } from '../contract-form/contract-form.component';

import { UserService } from '../services/user/user.service';
import { Web3Service } from '../services/web3/web3.service';
import { HttpService } from '../services/http/http.service';
import { ContractsService } from '../services/contracts/contracts.service';
import { ERC20_TOKEN_ABI } from '../services/web3/web3.constants';
import { UserInterface } from '../services/user/user.interface';

import { BigNumber } from 'bignumber.js';
import { Observable } from 'rxjs';
import { setTimeout } from 'timers';
import { resolve } from 'url';



export interface IReqData {
  id?: number;
  contract_type?: number;
  network: number;
  balance?: number;
  state?: string;
  name: string;
  detail?: string;
  user?: number;
  cost?: object;
  contract_details: {
    owner_address: string;
    reserve_address: string;
    end_timestamp: number;
    email: string;
    approved_tokens?: any;
    eth_contract?: any;
  };
}

export interface ITokens {
  tokens: any;
  approved: any;
  saved: any;
  check: any;
  removed: any;
  blockchain_approve: any;
  filterLimit: number;
  search: string;
}

export interface ITDate {
  max: any;
  min: any;
  current?: any;
}

export interface ITsStepper {
  current?: string;
  number?: number;
  button?: {
    process?: boolean;
    error?: boolean;
  }
}

@Component({
  selector: 'app-contract-form-all',
  templateUrl: './contract-form-all.component.html',
  styleUrls: ['../contract-form/contract-form.component.scss'],
  providers: [
    Location,
    { provide: LocationStrategy, useClass: PathLocationStrategy },
    { provide: DateAdapter, useClass: MomentDateAdapter, deps: [MAT_DATE_LOCALE, MAT_MOMENT_DATE_ADAPTER_OPTIONS] },
    { provide: MAT_DATE_FORMATS, useValue: MY_FORMATS }
  ]
})

export class ContractFormAllComponent implements AfterContentInit, OnInit, OnDestroy {
  @ViewChild('contactsReminderModal') contactsReminderModal: TemplateRef<any>;
  @ViewChild('ethSwapNotification') ethSwapNotification: TemplateRef<any>;
  @ViewChild(MatDatepicker) datepicker: MatDatepicker<Date>;

  @Output() costEmitter = new EventEmitter<any>();
  @Output() QuoteTokenCustom = new EventEmitter<any>();

  @ViewChild('metaMaskErrorTpl') metaMaskErrorTpl: TemplateRef<any>;
  private metaMaskErrorModal: MatDialogRef<any>;
  public metaMaskError: any = [];

  public reqData: IReqData = {
    contract_type: 23,
    network: 1,
    state: 'CHOOSE_NETWORK',
    name: 'TokenProtector',
    contract_details: {
      owner_address: '',
      reserve_address: '',
      end_timestamp: 1,
      email: '',
    }
  };

  public tokensData: ITokens = {
    tokens: [],
    approved: [],
    saved: [],
    check: [],
    removed: [],
    blockchain_approve: [],
    filterLimit: 9,
    search: ''
  }

  // declare dataLayer;
  
  public tsDate: ITDate = {
    min: new Date(new Date().setDate(new Date().getDate() + 1)),// new Date(new Date().setDate(new Date().getDate())),
    max: null,
    current: ''
  }

  public tsSrepper: ITsStepper = {
    current: 'CHOOSE_NETWORK',
    number: 0,
    button: {
      process: false,
      error: false
    }
  }

  private testTokens = {
    dev: [
      {token_name: "wish", token_short_name: "wish", platform: "ethereum", address: "0x7f7143631f89e1bbe955a7859cbf3ee082cc2898", popular: true},
      {token_name: "SimpeAtomicToken", token_short_name: "SAT", platform: "ethereum", address: "0x5aed0f4b4c6a8e5c271b7e6768c77dc627cddc6d", popular: true},
      {token_name: "AUTHToken", token_short_name: "AUTH", platform: "ethereum", address: "0x7ebc99a5e7cf27a2a285e3aa0b30f0f827efa94f", popular: true}
      // {token_name: "OSIOtoken", token_short_name: "OSIO", platform: "ethereum", address: "0x892b0276842a57a34d12b94e5037edf1fe34ca9d", popular: true},
      // {token_name: "WITHOUT REPORT", token_short_name: "WOUTREP", platform: "ethereum", address: "0x7e7b2e887059caf166511d3fb62b95406d4171fb", popular: true},
      // {token_name: "dfsdfsdf", token_short_name: "NNN", platform: "ethereum", address: "0x8941a9e6105cd3a0be831973356ccf64f217b53b", popular: true},
      // {token_name: "sdlkfjlkfj", token_short_name: "sdfdf", platform: "ethereum", address: "0x1b8c572b5924add0e8c95f5bb806ec74d35ad169", popular: true},
      // {token_name: "Token1", token_short_name: "TOKEN1", platform: "ethereum", address: "0x39ed1dcd54f404c06e81b8603e3e1ad2daffe48a", popular: true},
      // {token_name: "asd", token_short_name: "SS", platform: "ethereum", address: "0x262790479437c5ef30be6a71ff2c0dc7d801c29b", popular: true},
      // {token_name: "New14", token_short_name: "NEWH", platform: "ethereum", address: "0x190db67c0982345d702734f6f34b0fe344ba32f3", popular: true},
      // {token_name: "adfasfd", token_short_name: "asfsad", platform: "ethereum", address: "0x6eb3d9705dc5b1affb926e05dd97c26969bb137c", popular: true},
      // {token_name: "dsdsfsdf", token_short_name: "NNN", platform: "ethereum", address: "0xfb9706846a03d5666ff1afd450a64c9d963d642d", popular: true},
      // {token_name: "TS1", token_short_name: "TS1", platform: "ethereum", address: "0x907ff14618c1aac87d7904ab1111b9860bfeb45d", popular: true},
      // {token_name: "as", token_short_name: "2", platform: "ethereum", address: "0x04e8ef5e1d0f053c4cca7b3a5f99c0aef0a13de7", popular: true},
      // {token_name: "test", token_short_name: "TEST", platform: "ethereum", address: "0x78472f527e8887f7411b2dc4b33a4b47e2e978ca", popular: true},
      // {token_name: "sddf", token_short_name: "sdf", platform: "ethereum", address: "0xe6dcdd3684bdda1bc18bbc963717e3652492a3d3", popular: true},
      // {token_name: "sdf", token_short_name: "123", platform: "ethereum", address: "0x521374bfa08bc118226d9b77b75e919ad1be7111", popular: true},
      // {token_name: "jhgfddfghj", token_short_name: "VCX", platform: "ethereum", address: "0x6d002c1983edeb679db94be3bec65ec8241f5a63", popular: true},
      // {token_name: "MMMMMM", token_short_name: "MM", platform: "ethereum", address: "0x896d6509adfa16766d09f79cded3ba39ddf8a91b", popular: true},
      // {token_name: "dff", token_short_name: "FBF", platform: "ethereum", address: "0x2b9a92b58f5688151a5e698d57fd25721028fb58", popular: true},
      // {token_name: "sdgljsdgj", token_short_name: "TKN11", platform: "ethereum", address: "0x9edc0061d303332850e6a923d8b15a4a3b968d0c", popular: true},
      // {token_name: "dfg", token_short_name: "dfg", platform: "ethereum", address: "0x37d825aab5aaa605d4a1d4f0634171373de307eb", popular: true}
    ],
    prod: [
      {token_name: "Doken", token_short_name: "Dok", platform: "ethereum", address: "0x15dd8f5b635bdd37814e01701617efefad7f7106", popular: true},
      {token_name: "EJACOIN", token_short_name: "EJAC", platform: "ethereum", address: "0x6b6073fb17858f40885fb3af5bdb17e3609109fa", popular: true},
      {token_name: "USB", token_short_name: "USB", platform: "ethereum", address: "0xb0843018873a96a47733657f3e72802b82da9f3e", popular: true}
      // {token_name: "EIB", token_short_name: "EIB", platform: "ethereum", address: "0xe3307fe212faa38b3dfc390585650278c672fb82", popular: false},
      // {token_name: "LimitedToken", token_short_name: "LTT", platform: "ethereum", address: "0x02c7b1503a423db4db2c8c32352aca096a2c73ab", popular: false},
      // {token_name: "NetCash", token_short_name: "NCH", platform: "ethereum", address: "0x3ced044e30bb187347bcb1d4a912ed027d4e4589", popular: false},
      // {token_name: "TokenQ", token_short_name: "TQ", platform: "ethereum", address: "0xe29315addfd982945bb75bfa9e13442542b90b2c", popular: false},
      // {token_name: "LPGcoin", token_short_name: "LPGC1", platform: "ethereum", address: "0xa741c04f18d8eeb432afc6fe1f6518f3825baee1", popular: false},
      // {token_name: "Sapexeneth", token_short_name: "TSAP", platform: "ethereum", address: "0x2e8496fe9ee941dad60617f4bb8ec150bb948e82", popular: false},
      // {token_name: "Fatty Bom Boms", token_short_name: "FBB", platform: "ethereum", address: "0x91c901f498e1b2fdf3cedc665eb095a1bb030316", popular: false},
      // {token_name: "MYPROJECT", token_short_name: "NEWW", platform: "ethereum", address: "0xcbe4e1800718271cceffdf7a707679a470923d0c", popular: false},
      // {token_name: "MyNewToken", token_short_name: "MNT", platform: "ethereum", address: "0xb14dd1086b39189f88362d33cbec98b57b830ea5", popular: false},
      // {token_name: "Naira", token_short_name: "NGN", platform: "ethereum", address: "0xc6263b73b18bc3855099808d313680e5dd8e24ce", popular: false},
      // {token_name: "sdvsdv", token_short_name: "sdvsdv", platform: "ethereum", address: "0xd37d1f8807c6e1f2caab8647fb8d2f94d5f2f22e", popular: false},
      // {token_name: "XVinumProject", token_short_name: "XXVP", platform: "ethereum", address: "0x4856b0c1d09f8cf51d6ed0d744cbd1b7ef4423a7", popular: false},
      // {token_name: "XViumERC20", token_short_name: "XVPP", platform: "ethereum", address: "0xf9e68bffef5b8ad4f57f243ef4d8ed79ea10de40", popular: false},
      // {token_name: "MYPROJECT", token_short_name: "BEST", platform: "ethereum", address: "0x089543487486b3ecbfb3082d438acae41d7dc0a5", popular: false},
      // {token_name: "OTK", token_short_name: "OTK", platform: "ethereum", address: "0x613866849d35e3c8131496cdcfe5d1844509b1f9", popular: false},
      // {token_name: "EIBToken", token_short_name: "EIV", platform: "ethereum", address: "0xf7307f1711d20af5932c7697e06789f416f3543b", popular: false},
      // {token_name: "EI", token_short_name: "EO", platform: "ethereum", address: "0xba7dd24ae455faed48dbc47399214df1eb877406", popular: false},
      // {token_name: "VVV", token_short_name: "VVV", platform: "ethereum", address: "0xcbef0b7d9e6081d1d280d281d8ad97d0695fcc47", popular: false},
      // {token_name: "HumorEmese", token_short_name: "MESI", platform: "ethereum", address: "0xe74b6d9a1e994f3e95ca5805fb7dddc63554f661", popular: false},
      // {token_name: "EICoin", token_short_name: "EIC", platform: "ethereum", address: "0xa0601e9b239d9a00de9a9b5e24b0fb5fadb42c84", popular: false},
      // {token_name: "token002", token_short_name: "token002", platform: "ethereum", address: "0x092d353c50cbec09dd5c3c768f9386a3a244e8c0", popular: false},
      // {token_name: "EIToken", token_short_name: "EIT", platform: "ethereum", address: "0x30d4ef95ea890e90afcafc4142bc1e951b1f79a0", popular: false},
      // {token_name: "EASYCOIN2.0", token_short_name: "ESGO", platform: "ethereum", address: "0x8340aa570cfce05e9b1e53183beb0299c89beafa", popular: false},
      // {token_name: "EASYCOIN1.3", token_short_name: "EASI", platform: "ethereum", address: "0xfd1a886c6b1c7e17bba99a0690c82d856ab3ff0e", popular: false},
      // {token_name: "AdrianCoin", token_short_name: "AC", platform: "ethereum", address: "0xd398d3fa7f9ace6afab7e577741bea1ec2cc1372", popular: false},
      // {token_name: "TestToken", token_short_name: "TST", platform: "ethereum", address: "0x097a15ecf15c3cad93ba221dc386f688f3d1bfa5", popular: false},
      // {token_name: "Coin3", token_short_name: "CON3", platform: "ethereum", address: "0x96ba7c18dd09e5b7e1f718ffc456bcbcca72ec0a", popular: false},
      // {token_name: "ewqe", token_short_name: "MEW", platform: "ethereum", address: "0xc9fabfea1a8d9c7eb2ab66eae7b2395d5d603925", popular: false}
    ]
  }

  public networkMode = [
    {name: 'Error',tokens: [],popular: []},
    {name: 'Mainnet',tokens: [],popular: ['0xdac17f958d2ee523a2206206994597c13d831ec7','0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48','0x6b175474e89094c44da98b954eedeac495271d0f','0x514910771af9ca656af840dff83e8264ecf986ca']},
    {name: 'Testnet',tokens: [],popular: ['0x5aed0f4b4c6a8e5c271b7e6768c77dc627cddc6d','0x7f7143631f89e1bbe955a7859cbf3ee082cc2898','0xa0379b1ac68027a76373adc7800d87eb5c3fac5e','0x36d10c6800d569bb8c4fe284a05ffe3b752f972c', '0x006bea43baa3f7a6f765f14f10a1a1b08334ef45', '0x03c780cd554598592b97b7256ddaad759945b125', '0x01cc4151fe5f00efb8df2f90ff833725d3a482a3', '0x8810c63470d38639954c6b41aac545848c46484a', '0xa7fc5d2453e3f68af0cc1b78bcfee94a1b293650', '0xD29F0b5b3F50b07Fe9a9511F7d86F4f4bAc3f8c4', '0x7728dFEF5aBd468669EB7f9b48A7f70a501eD29D']}
  ]

  private popularMainTokens = ['0xdac17f958d2ee523a2206206994597c13d831ec7','0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48','0x6b175474e89094c44da98b954eedeac495271d0f','0x514910771af9ca656af840dff83e8264ecf986ca'];
  private popularTestTokens = ['0x5aed0f4b4c6a8e5c271b7e6768c77dc627cddc6d','0x7f7143631f89e1bbe955a7859cbf3ee082cc2898','0xa0379b1ac68027a76373adc7800d87eb5c3fac5e','0x36d10c6800d569bb8c4fe284a05ffe3b752f972c', '0x006bea43baa3f7a6f765f14f10a1a1b08334ef45', '0x03c780cd554598592b97b7256ddaad759945b125', '0x01cc4151fe5f00efb8df2f90ff833725d3a482a3', '0x8810c63470d38639954c6b41aac545848c46484a', '0xa7fc5d2453e3f68af0cc1b78bcfee94a1b293650', '0xD29F0b5b3F50b07Fe9a9511F7d86F4f4bAc3f8c4', '0x7728dFEF5aBd468669EB7f9b48A7f70a501eD29D'];
  
  private useFirtsToken: Boolean = true;
  private checkMainnTokens: Boolean = true;

  private checkTokens = [];

  private currentUser;
  private checker;
  public copiedAddresses = {};
  public approvedFinnalTokens:boolean = false;

  // remove in future

  public confirmErrorMessage = '';
  public selectedToken: any;
  public sub;

  constructor(
    protected contractsService: ContractsService,
    private userService: UserService,
    private route: ActivatedRoute,
    protected router: Router,
    private web3Service: Web3Service,
    private dialog: MatDialog,
    private httpService: HttpService
  ) {
    this.reqData = this.route.snapshot.data.contract || this.reqData;
    this.currentUser = this.userService.getUserModel();

    this.userService.getCurrentUser(false, true).subscribe((user: UserInterface) => {
      if (user.is_ghost)
        if (this.reqData.id) this.userService.openAuthForm();
      this.currentUser = user;
    });
  }

  ngOnInit() {

    this.sub = this.route.queryParams.subscribe(params => {
      this.reqData.network = +params['network'] || this.reqData.network;
    });

    if (this.reqData) {

      if(['ACTIVE','DONE'].includes(this.reqData.state)) {
        this.router.navigate([`/contract/${this.reqData.id}`, { banner: true }]);
        return;
      }

      if(this.reqData.id) this.tsDate.current = new Date(this.reqData.contract_details.end_timestamp * 1000);
    }
    else {
      this.reqData = {
        contract_type: 23,
        network: 1,
        state: 'CHOOSE_NETWORK',
        name: 'TokenProtector',
        contract_details: {owner_address: '',reserve_address: '',end_timestamp: 1,email: '',}
      } as IReqData;

      this.tsSrepper = {
        current: 'CHOOSE_NETWORK',
        button: {process: false}
      } as ITsStepper;
    }

    this.web3Service.init(this.reqData.network);
    this.web3Service.changeNetwork(this.reqData.network);
    
    console.log("contract: ", this.reqData);

    switch(window.location.host) {
      case 'devprot.mywish.io' : this.networkMode[2].tokens = Object.assign(this.testTokens.dev); break;
      case 'protector.mywish.io' : this.networkMode[2].tokens = Object.assign(this.testTokens.prod); break;
      default : this.networkMode[2].tokens = Object.assign(this.testTokens.dev); break;
    }
    
    this.checkContractStatus();
  }

  ngAfterContentInit() { }

  ngOnDestroy() {
    // if (this.checker) { clearTimeout(this.checker); }
    this.checker = undefined;
    // clearTimeout(this.checker);
    this.tokensData.tokens.map(token => {
      token.approved = false;
    });
    this.reqData.state = "CHOOSE_NETWORK";

    this.checkTokens.forEach((interval) => {
      clearInterval(interval);
    })
  }

  public changeNetwork(network?) {
    this.web3Service.changeNetwork(network);
    this.tokensData.tokens = Object.assign(this.networkMode[network].tokens);
  }

  public checkContractStatus(stepperState?:string) {

    const user = this.currentUser || this.userService.getUserModel();
    this.reqData.state = stepperState || this.reqData.state;
    
    switch (this.reqData.state) {
      case 'CHOOSE_NETWORK':
        console.log("contract status: ", this.reqData.state);
        this.tsSrepper.button.process = false;
        this.tsSrepper.current = 'CHOOSE_NETWORK';
        return;

      case 'PREPARE_ADDRESS':
        console.log("contract status: ", this.reqData.state);
        this.tsSrepper.button.process = true;
        this.tsSrepper.current = 'PREPARE_ADDRESS';
        this.tsSrepper.button.process = false;
        return;
      
      case 'PREPARE_DATE_EMAIL':
        console.log("contract status: ", this.reqData.state);

        if(this.reqData.contract_details.email === 'None') this.reqData.contract_details.email = '';

        this.tsSrepper.button.process = true;
        if (this.reqData.contract_details.owner_address === this.reqData.contract_details.reserve_address) {
          this.checkContractStatus('PREPARE_ADDRESS');
        } else { this.tsSrepper.current = 'PREPARE_DATE_EMAIL';}
        this.tsSrepper.button.process = false;
        return;
      
      case 'CREATING_UPDATE':
        console.log("contract status: ", this.reqData.state);
        this.tsSrepper.button.process = true;
  
        if (!this.currentUser.is_ghost) {
          if (this.reqData.id) {
            if(!this.reqData.contract_details.email || this.reqData.contract_details.email === 'None') this.reqData.contract_details.email = null;
            // if(!this.reqData.contract_details.email) this.reqData.contract_details.email = 'None';

            this.reqData.contract_details.eth_contract = null;
            this.contractsService.updateContract(this.reqData).then((result) => {
              this.reqData = result;
              this.checkContractStatus('CREATED');
            }).catch(err => { this.reqData.state = 'PREPARE_DATE_EMAIL';});

            if(!this.reqData.contract_details.email) this.reqData.contract_details.email = 'None';
          }
          else {
            if(!this.reqData.contract_details.email || this.reqData.contract_details.email === 'None') this.reqData.contract_details.email = null;
            
            this.contractsService.createContract(this.reqData).then((result) => {
              window.history.pushState(this.reqData.id, 'Create Contract', '/create/' + result.id);
              this.reqData = result;
              this.checkContractStatus('CREATED');
            }).catch(err => { this.reqData.state = 'PREPARE_DATE_EMAIL'; console.log("something went wrong...", err);});

            if(!this.reqData.contract_details.email) this.reqData.contract_details.email = 'None';
          }
        } else {this.reqData.state = 'PREPARE_DATE_EMAIL'; this.openLogInForm('CREATING_UPDATE');}
        return;

      case 'CREATED':
        this.tsSrepper.button.process = false;
        if(!this.reqData.contract_details.email) this.reqData.contract_details.email = 'None';
        console.log("contract status: ", this.reqData.state);
        return;

      case 'WAITING_FOR_CONFIRM':
      case 'WAITING_FOR_DEPLOYMENT':
        console.log("contract status: ", this.reqData.state);
        break;
      
      case 'CONFIRM_CONTRACT':
        console.log("contract status: ", this.reqData.state);
        this.tsSrepper.button.process = true;
        if (!this.currentUser.is_ghost) {
          this.contractsService.prepareForPayment(this.reqData.id).then((result) => {
            this.reqData = result;
            this.checkContractStatus();
            this.tsSrepper.button.process = false;
          }).catch(err => { console.log("something went wrong...", err); });
        } else {this.openLogInForm('CONFIRM_CONTRACT'); this.tsSrepper.button.process = false;}
        break;

      case 'WAITING_FOR_PAYMENT':
        console.log("contract status: ", this.reqData.state);
        this.costEmitter.emit(this.reqData.cost);
        break;
      
      case 'WAITING_FOR_APPROVE':
        console.log("contract status: ", this.reqData.state);
        let timewait = 0;

        if (this.route.snapshot.paramMap.get('dev_useTokens')) {
          this.web3Service.changeNetwork(this.route.snapshot.paramMap.get('dev_useTokens') === "test" ? 2 : 1);
          this.reqData.network = this.route.snapshot.paramMap.get('dev_useTokens') === "test" ? 2 : 1;
        }

        if (this.route.snapshot.paramMap.get('waitTime')) {
          timewait = Number(this.route.snapshot.paramMap.get('waitTime'));
        }

        // else {
        //   this.web3Service.changeNetwork(2);
        // }

        // this.web3Service.changeNetwork(1);
        // this.reqData.network = 1;
        
        if(!window['cmc_tokens_main'] && this.reqData.network === 1) {

          console.log("start download main tokens...");
          
          // try {
            setTimeout(() => {
            
              this.httpService.get('get_coinmarketcap_tokens/').toPromise().then((tokens) => {
              
                let index = tokens.length - 1;
        
                  while(index >= 0) {
                    if (tokens[index].platform !== 'ethereum')
                      tokens.splice(index, 1);
                    index -= 1;
                  }
        
                  tokens = tokens.sort((a, b) => {
                    const aRank = a.rank || 100000;
                    const bRank = b.rank || 100000;
                    return aRank > bRank ? 1 : aRank < bRank ? -1 : 0;
                  });
        
                  this.networkMode[1].popular.map(tokenAddress => {
                    tokens.find(token => {
                      (token.address === tokenAddress) ? token.popular = true : null;
                    });
                  });

                  tokens.map(token => {
                    token.approved = false;
                  });
        
                  window['cmc_tokens_main'] = tokens;
                  this.networkMode[1].tokens = Object.assign(window['cmc_tokens_main']);

                  this.checkMainnTokens = false;
                  this.tokensData.tokens = Object.assign(this.networkMode[this.reqData.network].tokens);

                  console.log("main tokens successfully downloaded: ",tokens);

              }).catch( err => { console.log('error in downloading tokens: ', err); })

            }, timewait);
      
          // }
          // catch (err) {
          //   console.log('error in downloading tokens: ', err); 
          // }
        }
        else {
          this.checkMainnTokens = false;
        }

        if(window['cmc_tokens_main'] && this.checkMainnTokens) { 
          this.tokensData.tokens = Object.assign(this.networkMode[this.reqData.network].tokens);
          this.checkMainnTokens = false;
        }

        if(this.useFirtsToken && this.reqData.network != 1) {
          this.tokensData.tokens = Object.assign(this.networkMode[this.reqData.network].tokens);
          this.useFirtsToken = false;
        }

        this.tokensData.approved = this.reqData.contract_details.approved_tokens;
        this.tokenApprovedInfo();
        break;
      
      case 'CONFIRM_APPROVE':
        console.log("contract status: ", this.reqData.state);
        if (!this.currentUser.is_ghost) {
          console.log(this.tokensData.saved.length,this.tokensData.saved);
          this.contractsService.confirmContract(this.reqData.id,this.tokensData.saved).then((result) => {
            this.reqData = result;
            this.checkContractStatus();
            this.reqData.state = 'WAITING_FOR_CONFIRM';

            if(this.reqData.network === 1) {
              window['dataLayer'].push({
                'event': 'protector_main'
              });
            }
            else {
              window['dataLayer'].push({
                'event': 'protector_test'
              });
            }

          }).catch(err => { this.reqData.state = 'FAIL_IN_CONFIRM'; console.log("something went wrong...", err); });
        } else { this.openLogInForm('CONFIRM_APPROVE'); }
        break;

      case 'SKIP_CONFIRM_APPROVE':
        console.log("contract status: ", this.reqData.state);
        if (!this.currentUser.is_ghost) {
          this.contractsService.skipConfirmContract(this.reqData.id).then((result) => {
            this.reqData = result;
            this.checkContractStatus();
            this.reqData.state = 'WAITING_FOR_CONFIRM';

            if(this.reqData.network === 1) {
              window['dataLayer'].push({
                'event': 'protector_main'
              });
            }
            else {
              window['dataLayer'].push({
                'event': 'protector_test'
              });
            }

          }).catch(err => { this.reqData.state = 'FAIL_IN_CONFIRM'; console.log("something went wrong...", err); });
        } else { this.openLogInForm('SKIP_CONFIRM_APPROVE'); }
        break;

      case 'ACTIVE':
      case 'WAITING_FOR_EXECUTION':
        this.router.navigate(['/contract/' + this.reqData.id, { banner: true }]);
        break;

      case 'FAIL_IN_CONFIRM':
        console.log("contract status: ", this.reqData.state);
        this.confirmErrorMessage = 'Something went wrong, please try again or contact us';
        (this.checker) ? clearTimeout(this.checker) : null;
        return;

      case 'POSTPONED':
      case 'CANCELLED':
      case 'FAILED':
      case 'TIME_IS_UP':
      case 'EXPIRED':
        console.log("contract status: ", this.reqData.state);
        (this.checker) ? clearTimeout(this.checker) : null;
        return;
      
      default:
        console.log("contract status: ", this.reqData.state);
        break;
    }

    if (!user.is_ghost && this.reqData.state != 'ACTIVE') { this.checker = setTimeout(() => { if(this.checker) { this.getContractInformation(); } }, 5000); } else { this.checker = undefined; }
  }

  private getContractInformation() {
    const promise = this.contractsService.getContract(this.reqData.id);
    promise.then((result) => {
      const costs = this.reqData.cost;
      this.reqData = result;
      this.reqData.cost = costs;
      this.checkContractStatus();
    }).catch((error) => {console.log('something went wrong, please try again later or check your auth ', error); });
  }

  private openLogInForm(state?:string) {
    this.userService.openAuthForm().then(() => { this.checkContractStatus(state || this.reqData.state)}, () => { this.tsSrepper.button.process  = false; });
  }

  private tokenApprovedInfo() {
    const approvedToken = this.tokensData.approved.map(token => {return token.address}); // с бекенда
    const blockchain_approve = this.tokensData.blockchain_approve; // с фронта добавлено
    const removedToken = this.tokensData.removed; // с фронта удалено

    console.log('add tokens from backend:',approvedToken);
    console.log('add tokens from frontend:',blockchain_approve);
    console.log('remove tokens from frontend',removedToken);

    // console.log('1. backend approve:',approvedToken);

    blockchain_approve.map(blockchain_approved => {
      if (!approvedToken.includes(blockchain_approved)) {
        approvedToken.push(blockchain_approved);
      }
    });

    // console.log('2. front approve:',approvedToken);

    const saveTokens = approvedToken.filter(approved => {
      return !removedToken.includes(approved);
    });

    // console.log('3. front approve after remove:', saveTokens);

    if(saveTokens.length != this.tokensData.saved.length){
      console.log(saveTokens.length,this.tokensData.saved.length)

      const newTokens = this.tokensData.tokens.map(token => {
        if (saveTokens.includes(token.address)) {token.approved = true;}
        else {token.approved = false;}
        // (this.networkMode[this.reqData.network].popular.includes(token.address)) ? token.popular = true : token.popular = false;
        return token;
      });

      this.tokensData.tokens = Object.assign(newTokens);
      this.tokensData.saved = Object.assign(saveTokens);
    }
  }

  public changeTokenStatus(value: string, disaprove?: boolean) {
    this.openTrxWindow(value, disaprove);
  }

  private openTrxWindow(tokenAddress, disaprove?:boolean) {

    console.log(tokenAddress);

    this.web3Service.getTokenInfo(tokenAddress).then((response) => {
      if (disaprove) {this.createTransactions(0, response.data);}
      else { this.createTransactions(1, response.data); }
    }).catch(err => {
      console.log(err);
      this.metaMaskError.type = 'Metamask error';
      this.metaMaskError.msg = err;
      this.metaMaskErrorModal = this.dialog.open(this.metaMaskErrorTpl, {
        width: '480px',
        panelClass: 'custom-dialog-container'
      });
    });

  }

  public startCheckAllowance(token,amount){
    console.log("prepare to check token for approve...", token);

      var interval = setInterval(() => {

        console.log('...check token for approve', token);
        
        return new Promise((resolve, reject) => {
            const tokenModel = token;
            const tokenContract = this.web3Service.getContract(ERC20_TOKEN_ABI, tokenModel.address);

            tokenContract.methods.allowance(this.reqData.contract_details.owner_address, this.reqData.contract_details.eth_contract.address).call().then((result) => {
              result = result ? result.toString(10) : result;
              result = result === '0' ? null : result;

              if (result && new BigNumber(result).minus(amount).isPositive()) {
                if(amount != 0) {
                  console.log('token successfully approved in blockchain',result);
                  this.tokensData.blockchain_approve.push(token.address);
                  this.tokensData.removed.filter(item => item !== token.address);
                  this.tokenApprovedInfo();
                  clearInterval(interval);
                }

                resolve(true);

              } else {
                
                if(amount === 0) {
                  console.log('token successfully removed in blockchain', result);
                  this.tokensData.removed.push(token.address);
                  this.tokenApprovedInfo();
                  clearInterval(interval);
                }

                resolve(0);
              }
            }, (err) => {
              console.log("something went wrong...", err);
              reject(false);
            });
          });

      }, 5000)

      this.checkTokens.push(interval);
  }


  private createTransactions(amount, token) {

    try {
      if (isNaN(amount)) { return; }

      const approveMethod = this.web3Service.getMethodInterface('approve');
      const amountToApprove = (amount === 0) ? 0 : new BigNumber(90071992.5474099).times(Math.pow(10, Math.max(token.decimals,7))).toString(10);

      this.startCheckAllowance(token,amountToApprove);

      const approveSignature = this.web3Service.encodeFunctionCall(
        approveMethod, [
          this.reqData.contract_details.eth_contract.address,
          amountToApprove
        ]
      );

      const approveTransaction = (wallet) => {
        return this.web3Service.sendTransaction({
          from: wallet.address,
          to: token.address,
          data: approveSignature
        }, wallet.type);
      };

      if (amount === 0) {

        const transactionsList: any[] = [{
          title: 'Cancel approve for  ' + token.symbol + ' tokens',
          to: token.address,
          data: approveSignature,
          // checkComplete: checkAllowance,
          action: approveTransaction,
          onlyOwner: this.reqData.contract_details.owner_address
        }];

        this.dialog.open(TransactionComponent, {
          width: '38.65em',
          panelClass: 'custom-dialog-container',
          data: {
            transactions: transactionsList,
            title: 'Cancel Approve',
          }
        });
      }
      else {

        console.log("transactions addasda")

        const transactionsList: any[] = [{
          title: 'Authorise the contract for transfer ' + token.symbol + ' tokens',
          to: token.address,
          data: approveSignature,
          action: approveTransaction,
          onlyOwner: this.reqData.contract_details.owner_address
        }];

        this.dialog.open(TransactionComponent, {
          width: '38.65em',
          panelClass: 'custom-dialog-container',
          data: {
            transactions: transactionsList,
            title: 'Approve',
          }
        });
      }


    } catch (err) {
      console.log("something went wrong...", err);
    }
  }


  // public onSelect(token: any): void {
  //   this.selectedToken = token;
  // }

  public onCopied(field) {
    if (this.copiedAddresses[field]) { return; }
    this.copiedAddresses[field] = true;
    setTimeout(() => {this.copiedAddresses[field] = false; }, 1000);
  }

  public loadMoreTokensFilter(tokenLength?: number) {
    if (((this.tokensData.filterLimit + 6) > tokenLength) && ((this.tokensData.filterLimit + 6) != tokenLength)) { this.tokensData.filterLimit = tokenLength; } else { this.tokensData.filterLimit = this.tokensData.filterLimit + 6; }
  }

  public dateChange() {
    const CurrentTime = new Date(this.tsDate.current);
    CurrentTime.setMinutes(new Date().getMinutes());
    // (new Date().getMinutes() >= 50) ? CurrentTime.setHours(new Date().getHours() + 1) : CurrentTime.setHours(new Date().getHours());
    CurrentTime.setHours(new Date().getHours() + 1)
    this.tsDate.current = new Date(CurrentTime);
    console.log('data chosen: ', this.tsDate.current);
    this.reqData.contract_details.end_timestamp = Math.floor(this.tsDate.current / 1000);
    console.log('timestamp of chosen data: ',this.reqData.contract_details.end_timestamp);
  }

}

@Injectable()
export class ContractEditResolver2 implements Resolve<any> {
  private currentUser;
  private route;

  constructor(
    private contractsService: ContractsService,
    private userService: UserService,
    private router: Router
  ) { }

  private contractId: number;

  private getContractInformation(observer) {
    const promise = this.contractsService.getContract(this.contractId);
    promise.then((result) => {
      observer.next(result);
      observer.complete();
    });
  }

  resolve(route: ActivatedRouteSnapshot) {
    this.route = route;

    if (route.params.id) {
      this.contractId = route.params.id;

      return new Observable((observer) => {
        const subscription = this.userService.getCurrentUser(false, true).subscribe((user) => {
          this.currentUser = user;
          if (!user.is_ghost) {
            this.getContractInformation(observer);
          } else {
            this.userService.openAuthForm()
              .then(() => { this.getContractInformation(observer); }
                , () => { this.router.navigate(['/create']); });
          }
          subscription.unsubscribe();
        });
        return {
          unsubscribe() { }
        };
      });
    }
  }
}
