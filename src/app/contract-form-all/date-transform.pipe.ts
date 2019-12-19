import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'dateTransform'
})
export class DateTransformPipe implements PipeTransform {

  transform(value: any, args?: any): any {
    return ((-1 * ((new Date().getTime() - new Date(value).getTime()) / 1000 / 60 / 60 / 24))).toFixed(0);
  }

}
