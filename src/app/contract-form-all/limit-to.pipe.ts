import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'limitTo'
})
export class limitTo implements PipeTransform {
  transform(value: any[], args: number) : string {
    // let limit = args.length > 0 ? parseInt(args[0], 10) : 10;
    // let trail = args.length > 1 ? args[1] : '...';

    return null; //value.slice(args, value.length);
  }
}