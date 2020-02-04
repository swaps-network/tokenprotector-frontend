import { AfterContentInit, Component, Injectable, OnDestroy, OnInit, TemplateRef, ViewChild } from '@angular/core';
import { MatDialog } from '@angular/material';
import { ActivatedRoute, ActivatedRouteSnapshot, Resolve, Router } from '@angular/router';
import { MatDatepicker } from '@angular/material';

import { UserService } from '../services/user/user.service';
import { Web3Service } from '../services/web3/web3.service';
import { ERC20_TOKEN_ABI } from '../services/web3/web3.constants';

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
};

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
    tokens: Object.assign(window['cmc_tokens']),
    approved: ''
  }

  public currentUser;
  public curDate;
  public states = CONTRACT_STATES;
  private checker;
  
  constructor(
    protected contractsService: ContractsService,
    private userService: UserService,
    private route: ActivatedRoute,
    protected router: Router,
    private web3Service: Web3Service,
    private dialog: MatDialog
  ) {

    this.reqData = this.route.snapshot.data.contract;

    this.currentUser = this.userService.getUserModel();
    this.userService.getCurrentUser().subscribe((userProfile: UserInterface) => {
      this.currentUser = userProfile;
    });

  }

  ngOnInit() {

    // this.tokensData.approved = [];
    // this.tokensData.tokens = Object.assign(window['cmc_tokens']);
    console.log('APPROVED TOKENS:',this.tokensData.approved);
    console.log('TOKENS:', this.tokensData.tokens);
    
    this.tokensData.tokens.map(token => {
      token.approved = false;
    });

    if (this.reqData) {
      console.log(this.reqData);

      this.reqData.contract_details.approved_tokens.map(tokenAddress => {
        this.tokensData.tokens.find(token => {
          (token.address === tokenAddress.address) ? token.approved = true : false;
        });
      });

      this.tokensData.approved = this.tokensData.tokens.filter((token) => {
        return token.approved;
      });

      this.curDate = new Date(this.reqData.contract_details.end_timestamp * 1000);
    }
    else {
      this.router.navigate(['/create']);
    }
  }

  ngAfterContentInit() {}

  ngOnDestroy(): void { 
    if (this.checker) { clearTimeout(this.checker); }
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

  private openTrxWindow(tokenAddress, disaprove?:boolean) {
    console.log(tokenAddress);
    this.web3Service.getTokenInfo(tokenAddress).then(
      (response) => {
        if (disaprove) {
          console.log('disaprove'); this.createTransactions(0, response.data);
        }
        else { this.createTransactions(1, response.data); }
      }
    );
  }

  private createTransactions(amount, token) {
    try {
      if (isNaN(amount)) { return; }

      const approveMethod = this.web3Service.getMethodInterface('approve');
      const amountToApprove = (amount === 0) ? 0 : new BigNumber(90071992.5474099).times(Math.pow(10, token.decimals)).toString(10);

      console.log(amountToApprove);

      const approveSignature = this.web3Service.encodeFunctionCall(
        approveMethod, [
          this.reqData.contract_details.eth_contract.address,
          amountToApprove
        ]
      );

      const checkAllowance = (wallet) => {
        return new Promise((resolve, reject) => {
          const tokenModel = token;
          const tokenContract = this.web3Service.getContract(ERC20_TOKEN_ABI, tokenModel.address);
          tokenContract.methods.allowance(wallet, this.reqData.contract_details.eth_contract.address).call().then((result) => {
            result = result ? result.toString(10) : result;
            result = result === '0' ? null : result;
            if (result && new BigNumber(result).minus(amount).isPositive()) {
              resolve(true);
            } else {
              reject(false);
            }
          }, () => {
            reject(false);
          });
        });
      };

      const approveTransaction = (wallet) => {
        return this.web3Service.sendTransaction({
          from: wallet.address,
          to: token.address,
          data: approveSignature
        }, wallet.type);
      };

      const transactionsList: any[] = [{
        title: 'Authorise the contract for getting ' + token.symbol + ' tokens',
        to: token.address,
        data: approveSignature,
        checkComplete: checkAllowance,
        action: approveTransaction
      }];

      this.dialog.open(TransactionComponent, {
        width: '38.65em',
        panelClass: 'custom-dialog-container',
        data: {
          transactions: transactionsList,
          title: 'Contribute',
          description: `For contribution you need to make ${transactionsList.length} transactions: authorise the contract and make the transfer`
        }
      });

      this.getContractInformation(true);

    } catch (e) {
      console.log(e);
    }
  }

  

  private cancelContract() {

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
        title: 'Authorise the contract for decline it',
        to: this.reqData.contract_details.eth_contract.address,
        data: approveSignature,
        action: approveTransaction
      }];

      this.dialog.open(TransactionComponent, {
        width: '38.65em',
        panelClass: 'custom-dialog-container',
        data: {
          transactions: transactionsList,
          title: 'Decline contract',
          description: `For decline you need to make ${transactionsList.length} transactions: authorise the contract and make the transfer`
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

        this.reqData.contract_details.approved_tokens.map(tokenAddress => {
          this.tokensData.tokens.find(token => {
            if (token.address === tokenAddress.address) {
              token.approved = true;
            }
            else {
              token.approved = false;
            }
          });
        });

        this.tokensData.approved = this.tokensData.tokens.filter((token) => {
          return token.approved;
        });

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
