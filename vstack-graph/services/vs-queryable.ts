import { Observable } from 'rxjs/Observable';
import 'rxjs/add/operator/map';

import { getPropertyName, getPropertyNamesFromProjection } from '../utilities';
import { Filter, PrimaryFilter } from '../filters';

export class VsQueryable<TResult> {
  private primaryFilter: string;
  private filters: string[] = [];
  private includes: string[] = [];
  private selects: string[] = [];

  constructor(private load: (boolean, string) => Observable<TResult[]>) { }

  withPrimaryFilter(filter: PrimaryFilter<TResult>): VsQueryable<TResult> {
    this.primaryFilter = filter.toString();
    return this;
  }

  filter(filter: Filter<TResult>): VsQueryable<TResult> {
    this.filters.push(filter.toString());
    return this;
  }

  select<TInterface>(projection: (i: TResult) => any): VsQueryable<TInterface> {
    this.selects = getPropertyNamesFromProjection(projection);

    let queryable: any = this;
    return queryable;
  }

  include(prop: (i: TResult) => any): VsQueryable<TResult>;
  include<T1>(prop1: (i: TResult) => T1[], prop2: (i: T1) => any): VsQueryable<TResult>;
  include<T1, T2>(prop1: (i: TResult) => T1[], prop2: (i: T1) => T2[], prop3: (i: T2) => any): VsQueryable<TResult>;
  include(...props: ((i: any) => any)[]): VsQueryable<TResult> {
    let propNames = props
      .map(prop => getPropertyName(prop).toLowerCase());

    let propName = propNames.join('.');

    if (this.includes.indexOf(propName) === -1) {
      this.includes.push(propName);
    }

    return this;
  }

  toList(): Observable<TResult[]> {
    let queryString = this.buildQueryString();
    let isLoadAll = !!!queryString;
    return this.load(isLoadAll, queryString);
  }

  firstOrDefault(): Observable<TResult> {
    return this.toList()
      .map(items => items.length ? items[0] : undefined);
  }

  private buildQueryString(): string {
    let queryStringParams: string[] = [];

    if (this.primaryFilter) {
      queryStringParams.push(`primary-filter=${this.primaryFilter}`);
    }

    if (this.filters.length) {
      queryStringParams.push(`filter=${this.filters.join('|')}`);
    }

    if (this.selects.length) {
      queryStringParams.push(`include=${this.selects.join(',')}`);
    }

    if (this.includes.length) {
      queryStringParams.push(`include=${this.includes.join(',')}`);
    }

    return queryStringParams.join('&');
  }
}
