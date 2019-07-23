import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
    name: 'pluralize'
})

export class Pluralize implements PipeTransform {
    transform(n: number): string {
        return n === 1 ? 'item' : 'items'
    }
}