import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';

import { Observable } from 'rxjs/Observable';
import { of } from 'rxjs/observable/of';
import { catchError, map, tap } from 'rxjs/operators';

import { Task } from '../models/task';
import { MessageService } from './message.service';

const httpOptions = {
  headers: new HttpHeaders({ 'Content-Type': 'application/json' })
};

@Injectable()
export class TaskService {

  private tasksUrl = "https://immense-springs-16199.herokuapp.com/api/tasks";  // URL to web api

  constructor(
    private http: HttpClient,
    private messageService: MessageService) { }

  /** GET tasks from the server */
  getTasks (): Observable<Task[]> {
    return this.http.get<Task[]>(this.tasksUrl)
      .pipe(
        tap(tasks => this.log(`fetched tasks`)),
        catchError(this.handleError('getTasks', []))
      );
  }

  /** GET task by _id. Return `undefined` when _id not found */
  getTaskNo404<Data>(_id: number): Observable<Task> {
    const url = `${this.tasksUrl}/?_id=${_id}`;
    return this.http.get<Task[]>(url)
      .pipe(
        map(tasks => tasks[0]), // returns a {0|1} element array
        tap(h => {
          const outcome = h ? `fetched` : `_id not find`;
          this.log(`${outcome} task _id=${_id}`);
        }),
        catchError(this.handleError<Task>(`getTask _id=${_id}`))
      );
  }

  /** GET task by _id. Will 404 if _id not found */
  getTask(_id: string): Observable<Task> {
    const url = `${this.tasksUrl}/${_id}`;
    return this.http.get<Task>(url).pipe(
      tap(_ => this.log(`fetched task _id=${_id}`)),
      catchError(this.handleError<Task>(`getTask _id=${_id}`))
    );
  }

  /* GET tasks whose name contains search term */
  searchTasks(term: string): Observable<Task[]> {
    if (!term.trim()) {
      // if not search term, return empty task array.
      return of([]);
    }
    return this.http.get<Task[]>(`api/tasks/?name=${term}`).pipe(
      tap(_ => this.log(`found tasks matching "${term}"`)),
      catchError(this.handleError<Task[]>('searchTasks', []))
    );
  }

  //////// Save methods //////////

  /** POST: add a new task to the server */
  addTask (task: Task): Observable<Task> {
    return this.http.post<Task>(this.tasksUrl, task, httpOptions).pipe(
      tap((task: Task) => this.log(`added task w/ _id=${task._id}`)),
      catchError(this.handleError<Task>('addTask'))
    );
  }

  /** DELETE: delete the task from the server */
  deleteTask (task: Task | number): Observable<Task> {
    const _id = typeof task === 'number' ? task : task._id;
    const url = `${this.tasksUrl}/${_id}`;

    return this.http.delete<Task>(url, httpOptions).pipe(
      tap(_ => this.log(`deleted task _id=${_id}`)),
      catchError(this.handleError<Task>('deleteTask'))
    );
  }

  /** PUT: update the task on the server */
  updateTask (task: Task): Observable<any> {
    return this.http.put(this.tasksUrl+'/'+task._id, task, httpOptions).pipe(
      tap(_ => this.log(`updated task _id=${task._id}`)),
      catchError(this.handleError<any>('updateTask'))
    );
  }

  /**
   * Handle Http operation that failed.
   * Let the app continue.
   * @param operation - name of the operation that failed
   * @param result - optional value to return as the observable result
   */
  private handleError<T> (operation = 'operation', result?: T) {
    return (error: any): Observable<T> => {

      // TODO: send the error to remote logging infrastructure
      console.error(error); // log to console instead

      // TODO: better job of transforming error for user consumption
      this.log(`${operation} failed: ${error.message}`);

      // Let the app keep running by returning an empty result.
      return of(result as T);
    };
  }

  /** Log a TaskService message with the MessageService */
  private log(message: string) {
    this.messageService.add('TaskService: ' + message);
  }
}
