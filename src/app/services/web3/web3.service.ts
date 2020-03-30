import {HttpService} from '../http/http.service';
import {Directive, EventEmitter, Injectable, Output, Pipe, PipeTransform} from '@angular/core';
import Web3 from 'web3';

import {AbstractControl, AsyncValidator, NG_ASYNC_VALIDATORS, ValidationErrors} from '@angular/forms';
import {Observable} from 'rxjs';

import {ERC20_TOKEN_ABI, ETH_NETWORKS} from './web3.constants';

const BigNumber = require('bignumber.js');

const EthereumCoin = {
  address: '0x0000000000000000000000000000000000000000',
  token_name: 'Ethereum',
  token_short_name: 'ETH',
  decimals: 18,
  image_link: 'https://github.com/MyWishPlatform/etherscan_top_tokens_images/raw/master/ethereum-icon.png',
  isEther: true,
  isEthereum: true,
  platform: 'ethereum',
  cmc_id: 2
};


export interface TokenInfoInterface {
  address: string;
  decimals: number;
  name: string;
  symbol: string;
  isEther: boolean;
  isEthereum?: boolean;
}

let IS_PRODUCTION = location.protocol === 'https:';
// let IS_PRODUCTION = window['network_mode_web3'];



const ETHERSCAN_URLS = {
  ETHERSCAN_ADDRESS: 'https://etherscan.io/',
  ROPSTEN_ETHERSCAN_ADDRESS: 'https://ropsten.etherscan.io/',
};

@Pipe({ name: 'etherscanUrl' })
export class EtherscanUrlPipe implements PipeTransform {
  transform(address, type) {
    const url = IS_PRODUCTION ? ETHERSCAN_URLS.ETHERSCAN_ADDRESS : ETHERSCAN_URLS.ROPSTEN_ETHERSCAN_ADDRESS;
    return url + type + '/' + address;
  }
}



@Injectable({
  providedIn: 'root'
})
export class Web3Service {

  constructor(
    private httpService: HttpService
  ) {
    this.cacheTokens = {};
    console.log('WEB3 CONSTRUCTOR');
    this.init()

    //this.connectMetamask();
  }

  private providers;
  private Web3;

  private cacheTokens: {
    [address: string]: any
  };

  private currentCall;

  public init(network?:number) {

    console.log('init web3');
    console.log('web3 mode:', network);
    network == 1 ? console.log('selected mainnetwork:',ETH_NETWORKS.INFURA_ADDRESS) : console.log('selected testnetwork', ETH_NETWORKS.ROPSTEN_INFURA_ADDRESS);

    this.providers = {};
    try {
      // if (metaMaskProvider && metaMaskProvider.publicConfigStore) {
      this.providers.metamask = Web3.givenProvider;  //|| new Web3.providers.WebsocketProvider('ws://localhost:8546');
      // }

    } catch (err) {
      console.log('Metamask not found');
    }

    try {
      this.providers.parity = new Web3.providers.HttpProvider('http://localhost:8545');
    } catch (err) {
      console.log('Parity not found');
    }

    try {
      this.providers.infura =
        new Web3.providers.HttpProvider(
          network == 1 ? ETH_NETWORKS.INFURA_ADDRESS : ETH_NETWORKS.ROPSTEN_INFURA_ADDRESS
        );
    } catch (err) {
      console.log('Infura not found');
    }

    network == 1 ? IS_PRODUCTION = true : IS_PRODUCTION = false;


    this.Web3 = new Web3(this.providers.infura);

    // this.changeNetwork();

    // const ethprovider = new Web3.providers.HttpProvider("http://10.0.0.42:7545");
    // const web3 = new Web3('http://');
    // web3.setProvider(ethprovider);
    
    // this.Web3 = new Web3(this.providers.infura);
    // console.log('PROVIDER', this.providers.infura)
    // console.log('WEB3', this.Web3)

  }

  public changeNetwork(network?) {
    console.log('WEB3 before', this.Web3._currentProvider);

    let newProvider = new Web3.providers.HttpProvider(
      network === 1 ? ETH_NETWORKS.INFURA_ADDRESS : ETH_NETWORKS.ROPSTEN_INFURA_ADDRESS
    );

    this.Web3 = new Web3(newProvider);
    // this.Web3.setProvider('dasda')

    console.log('WEB3 after', this.Web3._currentProvider);

    
    // console.log('metamask network:',Number(window['ethereum'].networkVersion));

    // if (window['ethereum'] && window['ethereum'].isMetaMask) {
    //   const networkVersion = Number(window['ethereum'].networkVersion);
    //   const usedNetworkVersion = network == 1 ? 1 : 3;
    //     if (usedNetworkVersion !== networkVersion) {
    //       console.log('please change network in  metamask')
    //     }
    // }
    // else {
    //   console.log('metamask not found. please install it to use that application');
    // }

    IS_PRODUCTION = network === 1;

  }

  public getSignedMetaMaskMsg(msg, addr) {

    return new Promise((resolve, reject) => {

      this.Web3.eth.setProvider(this.providers.metamask);

      this.Web3.eth.personal.sign(
        msg,
        addr,
        undefined,
        (signError, signature) => {
          if (!signError) {
            resolve(signature);
          } else {
            reject(signError);
          }
        }
      );
    });
  }

  public getContract(abi, address) {
    return new this.Web3.eth.Contract(abi, address);
  }

  public getMethodInterface(methodName, abi?) {
    abi = abi || ERC20_TOKEN_ABI;
    return abi.filter((m) => {
      return m.name === methodName;
    })[0];
  }

  private convertTokenInfo(tokenInfo) {
    return (tokenInfo && tokenInfo.name) ? {
      token_short_name: tokenInfo.symbol,
      token_name: tokenInfo.name,
      address: tokenInfo.address,
      decimals: parseInt(tokenInfo.decimals, 10) || 8
    } : false;
  }


  public getFullTokenInfo(tokenAddress, withoutSearch?: boolean) {
    return new Promise((resolve, reject) => {
      if (!tokenAddress) {
        resolve();
        return;
      }
      if (tokenAddress === '0x0000000000000000000000000000000000000000') {
        resolve({...EthereumCoin});
      } else {
        let tokenObject;

        tokenObject = window['cmc_tokens'].filter((tk) => {
          return tk.isEthereum && tk.address && (tk.address.toLowerCase() === tokenAddress.toLowerCase());
        })[0];

        this.getTokenInfo(tokenAddress, tokenObject).then((tokenInfo: {data: TokenInfoInterface}) => {
          const convertedToken = this.convertTokenInfo(tokenInfo.data);
          if (convertedToken) {
            const returnCoin = tokenObject ? {...tokenObject} : {...convertedToken};
            returnCoin.custom = !tokenObject;
            returnCoin.decimals = convertedToken.decimals;
            resolve(returnCoin);
          } else {
            resolve({...convertedToken});
          }
        }, (err) => {
          reject(err);
        });
      }
    });
  }

  public getTokenInfo(tokenAddress, tokenObject?) {
    const tokenInfoFields = !tokenObject ? ['decimals', 'symbol', 'name'] : ['decimals'];
    let fieldsCount = tokenInfoFields.length;
    const tokenInfo: any = tokenObject ? {
      symbol: tokenObject.token_short_name,
      name: tokenObject.token_name
    } : {};

    const address = tokenAddress ? tokenAddress.toLowerCase() : tokenAddress;

    if (this.cacheTokens[address]) {
      if (this.cacheTokens[address].token || this.cacheTokens[address].failed) {
        return new Promise((resolve, reject) => {
          if (this.cacheTokens[address].failed) {
            return reject({
              tokenAddress: true
            });
          }

          if (!this.Web3.utils.isAddress(address)) {
            return resolve({
              ethAddress: true
            });
          }
          resolve({
            data: {...this.cacheTokens[address].token}
          });
        }).then((res) => {
          return res;
        });
      }
      if (this.cacheTokens[address].inPromise) {
        if (this.Web3.utils.isAddress(address)) {
          return this.cacheTokens[address].inPromise;
        }
      }
    }

    const tokenPromise = new Promise((resolve, reject) => {
      if (!this.Web3.utils.isAddress(address)) {
        return resolve({
          ethAddress: true
        });
      }
      const contract = new this.Web3.eth.Contract(ERC20_TOKEN_ABI, address);


      const callMethod = (methodCall, method) => {
        const promise = methodCall.call();
        promise.then(result => {
          if ((method !== 'symbol') && (result === null)) {
            reject({
              tokenAddress: true
            });
            this.cacheTokens[address].failed = true;
            return;
          }
          tokenInfo[method] = result;
          fieldsCount--;
          if (!fieldsCount) {
            tokenInfo.address = tokenAddress;
            this.cacheTokens[address].token = {...tokenInfo};
            resolve({
              data: {...this.cacheTokens[address].token}
            });
          }
        }, (err) => {
          if (method !== 'symbol') {
            reject({
              tokenAddress: true
            });
            this.cacheTokens[address].failed = true;
          } else {
            fieldsCount--;
            if (!fieldsCount) {
              tokenInfo.address = tokenAddress;
              this.cacheTokens[address].token = {...tokenInfo};
              resolve({
                data: {...this.cacheTokens[address].token}
              });
            }
          }
        });
        this.currentCall = false;
        return promise;
      };

      tokenInfoFields.map((method) => {

        const methodCall = contract.methods[method]();

        if (!this.currentCall) {
          this.currentCall = callMethod(methodCall, method);
        } else {
          this.currentCall.then((result) => {
            this.currentCall = callMethod(methodCall, method);
          });
        }
      });
    }).then((res) => {
      return res;
    });

    this.cacheTokens[address] = {
      inPromise: tokenPromise
    };

    return tokenPromise;
  }

  private getAccountsByProvider(providerName, ifEnabled?) {
    console.log('======================================START SUBSCRIBER======================================')

    return new Observable((observer) => {
      const usedNetworkVersion = IS_PRODUCTION ? 1 : 3;

      if (window['ethereum'] && window['ethereum'].isMetaMask) {
        const networkVersion = Number(window['ethereum'].networkVersion);

        console.log(usedNetworkVersion,networkVersion)

        if (usedNetworkVersion !== networkVersion) {
          observer.error({
            code: 2,
            msg: 'Wrong network. Please change network.<br> For TestNet choose Ropsten.'
          });
          return;
        }

        window['ethereum'].on('accountsChanged', (accounts) => {
          console.log('refresh');
          observer.next({
            type: providerName,
            addresses: accounts
          });
        });

        if (!ifEnabled || window['ethereum'].selectedAddress) {
          window['ethereum'].enable().then((accounts) => {
            observer.next({
              type: providerName,
              addresses: accounts
            });
          }, () => {
            observer.error({
              code: 3
            });
          });
        } else {
          observer.error({
            code: 3
          });
        }
      } else {
        observer.error({
          code: 1,
          msg: 'Metamask extension is not found.<br> You can install it from <a href="https://metamask.io" target="_blank">metamask.io</a>'
        });
      }
      return {
        unsubscribe() {}
      };
    });
  }

  public getAccounts(owner?, ifEnabled?) {
    console.log('======================================START GET ACCOUNTS======================================')
    const addressesDictionary: any = {};
    return new Observable((observer) => {
      const accountsSubscriber = this.getAccountsByProvider('metamask', ifEnabled).subscribe((addresses: any) => {
        addressesDictionary[addresses.type] = addresses.addresses === null ? undefined : owner ? addresses.addresses.filter((addr) => {
          return addr.toLowerCase() === owner.toLowerCase();
        }) : addresses.addresses;

        observer.next(addressesDictionary);
        return {
          unsubscribe() {
            accountsSubscriber.unsubscribe();
          }
        };
      }, (error) => {
        observer.error(error);
      });
    });
  }

  public encodeFunctionCall(abi, data?) {
    return this.Web3.eth.abi.encodeFunctionCall(abi, data);
  }

  public sendTransaction(transactionConfig, provider?) {
    if (provider) {
      this.Web3.eth.setProvider(this.providers[provider]);
    }
    return new Promise((resolve, reject) => {
      this.Web3.eth.sendTransaction(transactionConfig, (err, response) => {
        if (!err) {
          const trxSubscription = setInterval(() => {
            this.Web3.eth.getTransactionReceipt(response, (error, transaction) => {
              if (transaction) {
                if (transaction.status) {
                  resolve(transaction);
                } else {
                  reject(err);
                }
                clearInterval(trxSubscription);
              }
              if (error) {
                clearInterval(trxSubscription);
              }
            });
          }, 1000);
        } else {
          reject(err);
        }
      }).then((result) => {
        console.log(result);
      }, (err) => {
        console.log(err);
      }).finally(() => {
        if (provider) {
          this.Web3.eth.setProvider(this.providers.infura);
        }
      });
    });
  }

  public getSWAPSCoinInfo(data) {

    data.tokens_info = {};

    return new Promise((resolve, reject) => {
      let quoteToken;
      let baseToken;


      // Check quote coin
      const quoteTokenObject = window['cmc_tokens'].filter((tk) => {
        return tk.isEthereum && ((tk.address === data.quote_address) || (tk.mywish_id === data.quote_coin_id));
      })[0];

      if (quoteTokenObject && !data.quote_address) {
        data.quote_address = quoteTokenObject.address;
      }

      if (data.quote_address) {
        quoteToken = quoteTokenObject ? {...quoteTokenObject} : false;
        this.getFullTokenInfo(data.quote_address, true).then((tokenInfo: TokenInfoInterface) => {
          if (quoteToken) {
            data.tokens_info.quote = {
              token: {...quoteToken}
            };
            data.tokens_info.quote.token.decimals = tokenInfo.decimals;
          } else {
            tokenInfo.isEthereum = true;
            data.tokens_info.quote = {
              token: {...tokenInfo}
            };
          }
        }, () => {
          data.tokens_info.quote = {
            token: {...quoteToken}
          };
        }).finally(() => {
          data.tokens_info.quote.amount = data.quote_limit;
          if (data.tokens_info.base) {
            resolve(data);
          }
        });
      } else {
        data.tokens_info.quote = {
          token: {...window['cmc_tokens'].filter((tk) => {
            return tk.mywish_id === data.quote_coin_id;
          })[0]}
        };
        data.tokens_info.quote.amount = data.quote_limit;
        if (data.tokens_info.base) {
          setTimeout(() => {
            resolve(data);
          });
        }
      }


      // Check base coin
      const baseTokenObject = window['cmc_tokens'].filter((tk) => {
        return tk.isEthereum && ((tk.address === data.base_address) || (tk.mywish_id === data.base_coin_id));
      })[0];

      if (baseTokenObject && !data.base_address) {
        data.base_address = baseTokenObject.address;
      }

      if (data.base_address) {
        baseToken = baseTokenObject ? {...baseTokenObject} : false;
        this.getFullTokenInfo(data.base_address, true).then((tokenInfo: TokenInfoInterface) => {
          if (baseToken) {
            data.tokens_info.base = {
              token: {...baseToken}
            };
            data.tokens_info.base.token.decimals = tokenInfo.decimals;
          } else {
            tokenInfo.isEthereum = true;
            data.tokens_info.base = {
              token: {...tokenInfo}
            };
          }
        }, () => {
          data.tokens_info.base = {
            token: {...baseToken}
          };
        }).finally(() => {
          data.tokens_info.base.amount = data.base_limit;
          if (data.tokens_info.quote) {
            resolve(data);
          }
        });
      } else {
        data.tokens_info.base = {
          token: {...window['cmc_tokens'].filter((tk) => {
            return tk.mywish_id === data.base_coin_id;
          })[0]}
        };
        data.tokens_info.base.amount = data.base_limit;
        if (data.tokens_info.quote) {
          setTimeout(() => {
            resolve(data);
          });
        }
      }
    });
  }
}



// noinspection JSAnnotator
@Directive({
  selector: '[appEthTokenValidator]',
  providers: [{ provide: NG_ASYNC_VALIDATORS, useExisting: EthTokenValidatorDirective, multi: true }]
})

export class EthTokenValidatorDirective implements AsyncValidator {

  @Output() TokenResolve = new EventEmitter<any>();

  constructor(
    private web3Service: Web3Service
  ) {}

  validate(
    ctrl: AbstractControl
  ): Promise<ValidationErrors | null> | Observable<ValidationErrors | null> {
    return this.web3Service.getFullTokenInfo(ctrl.value).then((result: any) => {

      if (result && (result.token_short_name)) {
        this.TokenResolve.emit(result);
        return null;
      } else {
        return {
          token: true
        };
      }
    });
  }
}
