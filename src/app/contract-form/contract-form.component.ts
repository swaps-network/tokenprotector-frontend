import { AfterContentInit, Component, Injectable, OnDestroy, OnInit, TemplateRef, ViewChild } from '@angular/core';
import { MatDialog, MatDialogRef } from '@angular/material';
import { ActivatedRoute, ActivatedRouteSnapshot, Resolve, Router } from '@angular/router';
import { MatDatepicker } from '@angular/material';

import { UserService } from '../services/user/user.service';
import { Web3Service } from '../services/web3/web3.service';
import { ERC20_TOKEN_ABI } from '../services/web3/web3.constants';

import { HttpService } from '../services/http/http.service';
import { ContractsService } from '../services/contracts/contracts.service';
import { UserInterface } from '../services/user/user.interface';

import { CONTRACT_STATES } from '../contract-preview/contract-states';
import { BigNumber } from 'bignumber.js';
import { Observable } from 'rxjs';

import { TransactionComponent } from '../transaction/transaction.component';

export interface IContractDetails {
  base_address?: string;
  quote_address?: string;
  base_limit?: string;
  quote_limit?: string;
  stop_date?: number;
  owner_address?: string;
  public?: boolean|undefined;
  unique_link?: string;
  unique_link_url?: string;
  eth_contract?: any;

  broker_fee: boolean;
  broker_fee_address: string;
  broker_fee_base: number;
  broker_fee_quote: number;

  tokens_info?: {
    base: {
      token: any;
      amount: string;
    };
    quote: {
      token: any;
      amount: string;
    };
  };


  whitelist?: any;
  whitelist_address?: any;
  min_base_wei?: any;
  memo_contract?: any;
  min_quote_wei?: any;
}

export interface IContract {
  isSwapped?: boolean;
  contract_details?: IContractDetails;
  id?: number|undefined;
  contract_type?: number;
  network?: 1;
  state?: string;
  cost?: any;
  name?: string;
  isAuthor?: boolean;
  user?: number;
}

export const MY_FORMATS = {
  useUtc: true,
  parse: {
    dateInput: 'LL',
  },
  display: {
    dateInput: 'DD.MM.YYYY',
    monthYearLabel: 'MMM YYYY',
    dateA11yLabel: 'X',
    monthYearA11yLabel: 'MMMM YYYY',
  },
};




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
  created_date?: any;
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
  tokens_prepare: any;
  saved: any;
  check: any;
  removed: any;
  blockchain_approve: any;
  filterLimit: number;
  search: string;
}


@Component({
  selector: 'app-contract-form',
  templateUrl: './contract-form.component.html',
  styleUrls: ['./contract-form.component.scss'],
  providers: []
})
  
export class ContractFormComponent implements AfterContentInit, OnInit, OnDestroy {

  @ViewChild('rateNotification') rateNotification: TemplateRef<any>;
  @ViewChild('extraForm') public extraForm;
  @ViewChild(MatDatepicker) datepicker: MatDatepicker<Date>;

  @ViewChild('metaMaskErrorTpl') metaMaskErrorTpl: TemplateRef<any>;
  private metaMaskErrorModal: MatDialogRef<any>;
  public metaMaskError: any = [];

  public reqData: IReqData = {
    contract_type: 23,
    network: 1,
    state: 'PREPARE',
    name: 'TokenProtector',
    contract_details: {
      owner_address: '',
      reserve_address: '',
      end_timestamp: 1,
      email: '',
    }
  }

  public tokensData: ITokens = {
    tokens: [],
    tokens_prepare: [],
    approved: [],
    saved: [],
    check: [],
    removed: [],
    blockchain_approve: [],
    filterLimit: 6,
    search: ''
  }

  private testTokens = {
    dev: [
      {token_name: "wish", token_short_name: "wish", platform: "ethereum", address: "0x7f7143631f89e1bbe955a7859cbf3ee082cc2898", popular: true},
      {token_name: "SimpeAtomicToken", token_short_name: "SAT", platform: "ethereum", address: "0x5aed0f4b4c6a8e5c271b7e6768c77dc627cddc6d", popular: true},
      {token_name: "AUTHToken", token_short_name: "AUTH", platform: "ethereum", address: "0x7ebc99a5e7cf27a2a285e3aa0b30f0f827efa94f", popular: true}
    ],
    prod: [
      {token_name: "Doken", token_short_name: "Dok", platform: "ethereum", address: "0x15dd8f5b635bdd37814e01701617efefad7f7106", popular: true},
      {token_name: "Amary filo", token_short_name: "AMFI", platform: "ethereum", address: "0x149879fabe5101d5bd280bf5a50bd7557cd9ba35", popular: true},
      {token_name: "USB", token_short_name: "USB", platform: "ethereum", address: "0xb0843018873a96a47733657f3e72802b82da9f3e", popular: true}
    ]
  }

  public networkMode = [
    {name: 'Error',tokens: [],popular: []},
    {name: 'Mainnet',tokens: [],popular: ['0x5aed0f4b4c6a8e5c271b7e6768c77dc627cddc6d','0x7f7143631f89e1bbe955a7859cbf3ee082cc2898','0xa0379b1ac68027a76373adc7800d87eb5c3fac5e','0x36d10c6800d569bb8c4fe284a05ffe3b752f972c', '0x006bea43baa3f7a6f765f14f10a1a1b08334ef45', '0x03c780cd554598592b97b7256ddaad759945b125', '0x01cc4151fe5f00efb8df2f90ff833725d3a482a3', '0x8810c63470d38639954c6b41aac545848c46484a', '0xa7fc5d2453e3f68af0cc1b78bcfee94a1b293650', '0xD29F0b5b3F50b07Fe9a9511F7d86F4f4bAc3f8c4', '0x7728dFEF5aBd468669EB7f9b48A7f70a501eD29D']},
    {name: 'Testnet',tokens: [],popular: ['0x5aed0f4b4c6a8e5c271b7e6768c77dc627cddc6d','0x7f7143631f89e1bbe955a7859cbf3ee082cc2898','0xa0379b1ac68027a76373adc7800d87eb5c3fac5e','0x36d10c6800d569bb8c4fe284a05ffe3b752f972c', '0x006bea43baa3f7a6f765f14f10a1a1b08334ef45', '0x03c780cd554598592b97b7256ddaad759945b125', '0x01cc4151fe5f00efb8df2f90ff833725d3a482a3', '0x8810c63470d38639954c6b41aac545848c46484a', '0xa7fc5d2453e3f68af0cc1b78bcfee94a1b293650', '0xD29F0b5b3F50b07Fe9a9511F7d86F4f4bAc3f8c4', '0x7728dFEF5aBd468669EB7f9b48A7f70a501eD29D']}
  ]

  private checkMainnTokens: Boolean = false;
  public toggleAddTokens:boolean = false;
  private startTokien = 0;
  private endTokien = 0;
  public downloadTokens: Boolean = false;

  private main_tokens;

  private checkTokens = [];

  public sub;
  public firstViewBanner = null;

  public currentUser;
  public curDate;
  public states = CONTRACT_STATES;
  private checker;
  public showInfoMsg:boolean = true;
  public dateToExecute:number = 0;
  public dateToExecuteRagne:number = 0;
  public executeRagne:number;
  
  constructor(
    protected contractsService: ContractsService,
    private userService: UserService,
    private route: ActivatedRoute,
    protected router: Router,
    private web3Service: Web3Service,
    private dialog: MatDialog,
    private httpService: HttpService
  ) {

    this.reqData = this.route.snapshot.data.contract;

    this.currentUser = this.userService.getUserModel();
    this.userService.getCurrentUser().subscribe((userProfile: UserInterface) => {
      this.currentUser = userProfile;
    });

    this.route.snapshot.paramMap.get('banner') ? this.firstViewBanner = this.route.snapshot.paramMap.get('banner') : null;
  }

  ngOnInit() {

    this.tokensData.approved = this.tokensData.tokens.filter((token) => {
      return token.approved;
    });

    if (this.reqData) {

      window.history.pushState(this.reqData.id, 'Contract', '/contract/' + this.reqData.id);

      this.reqData.contract_details.approved_tokens.map(tokenAddress => {
        this.tokensData.tokens.find(token => {
          (token.address === tokenAddress.address) ? token.approved = true : false;
        });
      });

      this.checkContractState();

      this.curDate = new Date(this.reqData.contract_details.end_timestamp * 1000);
      this.dateToExecute = Math.round((new Date(this.curDate).getTime() - new Date().getTime()) / (24 * 60 * 60 * 1000)); // осталось дней
      this.dateToExecuteRagne = Math.round((new Date(this.reqData.created_date).getTime() - new Date(this.curDate).getTime()) / (24 * 60 * 60 * 1000))*-1; // разница от начала и конца в днях
      this.executeRagne = ((this.dateToExecuteRagne - this.dateToExecute)/this.dateToExecuteRagne*100); // % от разницы и оставшихся дней

      if(this.dateToExecute <= 0 || this.dateToExecute === -0) {
        this.dateToExecute = 0;
        this.executeRagne = 100;
      }

      this.web3Service.changeNetwork(this.reqData.network);

      this.tokensData.approved = this.reqData.contract_details.approved_tokens;

      switch(window.location.host) {
        case 'devprot.mywish.io' : this.networkMode[2].tokens = Object.assign(this.testTokens.dev); break;
        case 'protector.mywish.io' : this.networkMode[2].tokens = Object.assign(this.testTokens.prod); break;
        default : this.networkMode[2].tokens = Object.assign(this.testTokens.dev); break;
      }

      if (this.route.snapshot.paramMap.get('dev_useTokens')) {
        this.web3Service.changeNetwork(this.route.snapshot.paramMap.get('dev_useTokens') === "test" ? 2 : 1);
        this.reqData.network = this.route.snapshot.paramMap.get('dev_useTokens') === "test" ? 2 : 1;
      }

      this.reseachTokens();

    }
    else {
      this.router.navigate(['/create']);
    }
  }

  ngAfterContentInit() {}

  ngOnDestroy(): void { 
    this.checker = undefined;

    this.reqData.state = "CHOOSE_NETWORK";

    this.checkTokens.forEach((interval) => {
      clearInterval(interval);
    })

  }

  private reseachTokens() {
    console.log("initialize research tokens...");

    if( this.reqData.network === 1 ) {

      if(!window['cmc_tokens_main']) {
        console.log("start download main tokens...");
        
        this.main_tokens = this.httpService.get('get_coinmarketcap_tokens/').toPromise().then((tokens) => {
          
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

          this.reqData.contract_details.approved_tokens.map(token => {
            tokens.map(t => {
              if(t.address === token.address) t.approved = true;
              console.log(t.address, t.approved)
              return t
            })
          })
    
          window['cmc_tokens_main'] = tokens;
    
          this.networkMode[1].tokens = Object.assign(window['cmc_tokens_main']);
          this.tokensData.tokens = Object.assign(window['cmc_tokens_main']);

          this.downloadTokens = true;
          this.checkMainnTokens = true;
    
          console.log("main tokens successfully downloaded: ",tokens);
      
        }).catch( err => { console.log('error in downloading tokens: ', err); })

      }
      else {
        this.networkMode[1].tokens = Object.assign(window['cmc_tokens_main']);
        this.tokensData.tokens = Object.assign(window['cmc_tokens_main']);
        this.downloadTokens = true;
      }

      this.checkMainnTokens = true;
      this.tokenApprovedInfo(true);
    }
    
    if( this.reqData.network === 2) {
      console.log("start research test tokens...");

      this.tokensData.tokens = Object.assign(this.networkMode[this.reqData.network].tokens);

      this.tokensData.tokens.map(token => {
        this.tokensData.approved.includes(token.address) ? token.approved = true : token.approved = false;
      })

      this.downloadTokens = true;
      this.checkMainnTokens = true;

      console.log("end research test tokens...");
      this.tokenApprovedInfo(true);
    }

    console.log("end initialize research tokens...");
  }

  private checkContractState() {
    console.log(this.reqData.state);
    var error: boolean = false;

    const promise = this.contractsService.getContract(this.reqData.id);
    promise.then((result) => {
      this.reqData = result;
    }).catch((error) => {console.log('something went wrong, please try again later or check your auth', error); error = true; });

    if (!['DONE','POSPONED','DECLINED','CANCELLED'].includes(this.reqData.state) && !error) { this.checker = setTimeout(() => { if(this.checker) { this.checkContractState(); } }, 5000); } else { this.checker = undefined; }
  }
  
  public saveContractSourceCode() {
    const filename = this.reqData.name + '-' + this.reqData.contract_details.eth_contract.address + '.sol';
    const data = this.reqData.contract_details.eth_contract.source_code;
    const mime = 'text/plain';
    
    const blob = new Blob([data], { type: mime || 'text/plain' });

    if (typeof window.navigator.msSaveBlob !== 'undefined') window.navigator.msSaveBlob(blob, filename);
    else {
      let blobURL = window.URL.createObjectURL(blob);
      let tempLink = document.createElement('a');
      tempLink.style.display = 'none';
      tempLink.href = blobURL;
      tempLink.setAttribute('download', filename); 
      
      if (typeof tempLink.download === 'undefined') {
          tempLink.setAttribute('target', '_blank');
      }
      
      document.body.appendChild(tempLink);
      tempLink.click();
      document.body.removeChild(tempLink);
      window.URL.revokeObjectURL(blobURL);
    }
  }

  public toggleAddTokensClick() {
    this.toggleAddTokens = true;
  }

  private tokenApprovedInfo(first?:boolean) {
    const approvedToken = this.tokensData.approved.map(token => {return token.address}); // с бекенда
    const blockchain_approve = this.tokensData.blockchain_approve; // с фронта добавлено
    const removedToken = this.tokensData.removed; // с фронта удаленр

    console.log('I.   add:',approvedToken);
    console.log('II.  add front:',blockchain_approve);
    console.log('II. remove front:',removedToken);

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

      if(!first) {
        console.log(this.tokensData.saved.length,this.tokensData.saved);
        this.contractsService.confirmContract(this.reqData.id,this.tokensData.saved).then((result) => {
          console.log('SUCCESS APPROVED', result);
          this.reqData = result;
        }).catch(err => { this.reqData.state = 'FAIL_IN_CONFIRM'; console.log(err); });
      }
    }

    console.log('TOKENS APPROVED',this.tokensData.saved);
  }

  public loadMoreTokensFilter(tokenLength?: number) {
    if (((this.tokensData.filterLimit + 6) > tokenLength) && ((this.tokensData.filterLimit + 6) != tokenLength)) { this.tokensData.filterLimit = tokenLength; } else { this.tokensData.filterLimit = this.tokensData.filterLimit + 6; }
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
    console.log(token);

      var interval = setInterval(() => {

        console.log('Cheking:',token);
        
        return new Promise((resolve, reject) => {
            const tokenModel = token;
            const tokenContract = this.web3Service.getContract(ERC20_TOKEN_ABI, tokenModel.address);

            tokenContract.methods.allowance(this.reqData.contract_details.owner_address, this.reqData.contract_details.eth_contract.address).call().then((result) => {
              result = result ? result.toString(10) : result;
              result = result === '0' ? null : result;

              if (result && new BigNumber(result).minus(amount).isPositive()) {
                if(amount != 0) {
                  console.log('BLOCKCHAIN TOKEN IF:',result);
                  this.tokensData.blockchain_approve.push(token.address);
                  this.tokensData.removed.filter(item => item !== token.address);
                  this.tokenApprovedInfo();
                  clearInterval(interval);
                }

                resolve(true);

              } else {
                
                if(amount === 0) {
                  console.log('BLOCKCHAIN TOKEN ELSE:', result);
                  this.tokensData.removed.push(token.address);
                  this.tokenApprovedInfo(true);
                  clearInterval(interval);
                }

                resolve(0);
              }
            }, (err) => {
              console.log(err);
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
      const amountToApprove = (amount === 0) ? 0 : new BigNumber(90071992.5474099).times(Math.pow(10, token.decimals)).toString(10);

      this.startCheckAllowance(token,amountToApprove);
      this.getContractInformation();

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

        const transactionsList: any[] = [{
          title: 'Authorise the contract for transfer ' + token.symbol + ' tokens',
          to: token.address,
          data: approveSignature,
          //checkComplete: this.startCheckAllowance(token,amountToApprove),
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


    } catch (e) {
      console.log(e);
    }
  }

  public cancelContract() {

    try {
      let cancelMethod;
      let approveSignature;

      cancelMethod = this.web3Service.getMethodInterface('selfdestruction', this.reqData.contract_details.eth_contract.abi);
      approveSignature = this.web3Service.encodeFunctionCall(
        cancelMethod, []
      );

      const approveTransaction = (wallet) => {
        return this.web3Service.sendTransaction({
          from: wallet.address,
          to: this.reqData.contract_details.eth_contract.address,
          data: approveSignature
        }, wallet.type);
      };

      const transactionsList: any[] = [{
        // title: 'Authorise the contract for decline it',
        to: this.reqData.contract_details.eth_contract.address,
        data: approveSignature,
        action: approveTransaction
      }];

      this.dialog.open(TransactionComponent, {
        width: '38.65em',
        panelClass: 'custom-dialog-container',
        data: {
          transactions: transactionsList,
          title: 'Cancel',
          description: `To cancel the contact please make the transaction from protected address`
        }
      });
      this.getContractInformation();

    } catch (e) {
      this.checker = undefined;
      console.log(e);
    }
  }

  private getContractInformation(unapprove?:boolean) {
    console.log('contract: ', this.reqData.state, this.reqData.contract_details.approved_tokens);
    this.checker = setTimeout(() => { this.getContractInformation(); }, 15000);

    const promise = this.contractsService.getContract(this.reqData.id);
    promise.then((result) => {
      this.reqData = result;
      if (result.state === 'CANCELLED') clearTimeout(this.checker);
      if (unapprove && result.contract_details.approved_tokens.length <= 1) {
        clearTimeout(this.checker);
      }
      else {
        this.tokensData.approved = this.reqData.contract_details.approved_tokens;
        this.tokenApprovedInfo(true);
      }
    }).catch((error) => { console.log('something went wrong, please try again later or check your auth', error); });
  }

}


@Injectable()
export class ContractEditResolver implements Resolve<any> {
  private currentUser;
  private route;

  constructor(
    private contractsService: ContractsService,
    private userService: UserService,
    private router: Router
  ) {}

  private contractId: number;


  private getContractInformation(observer, isPublic?) {
    let promise = this.contractsService.getContract(this.contractId);
    promise.then((result) => { observer.next(result); });
    promise.catch((error) => { console.log('Error, cant find contract', error) });
    observer.complete();
  };

  resolve(route: ActivatedRouteSnapshot) {
    this.route = route;
    
    if (route.params.id) {
      this.contractId = route.params.id;

      return new Observable((observer) => {

        const subscription = this.userService.getCurrentUser(false, true).subscribe((user) => {
          this.currentUser = user;

          if (!user.is_ghost) this.getContractInformation(observer);
          else {
            this.userService.openAuthForm()
              .then(() => { this.getContractInformation(observer); }
              ,() => { this.router.navigate(['/create']); });
          }
          subscription.unsubscribe();
        });
        return {
          unsubscribe() {}
        };

      });

    }

  }
}
