import { Pipe, PipeTransform } from '@angular/core';
import { tokenName } from '@angular/compiler';

@Pipe({
  name: 'FilterTokens'
})
export class FilterTokens implements PipeTransform {

  transform(value: any, isPupular?: boolean, isSearch?: boolean, search?: string, isApproved?: boolean): any {
    
    let tokensAll = value;
    let tokensQuery = [];

    tokensQuery = tokensAll.filter((token) => {
      if (isApproved) {
        return token.approved;
      }
      if (isPupular && token.popular && !token.approved) return token;
      if (isSearch) return ((token.token_name.toLowerCase().indexOf(search.toLowerCase()) > -1 || token.token_short_name.toLowerCase().indexOf(search.toLowerCase()) > -1) && !token.approved);
    });

    return tokensQuery;
  }

}
