import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable, of, throwError } from 'rxjs';
import { map, catchError, tap } from 'rxjs/operators';
import { User } from '../models/user.model';

interface JsonPlaceholderUser {
  id: number;
  name: string;
  email: string;
  username: string;
}

@Injectable({
  providedIn: 'root'
})
export class UserService {
  private usersSubject = new BehaviorSubject<User[]>([]);
  public users$: Observable<User[]> = this.usersSubject.asObservable();
  private readonly API_URL = 'https://jsonplaceholder.typicode.com/users';
  private readonly roles = ['Admin', 'Editor', 'Viewer'];
  private readonly STORAGE_KEY = 'manually_added_users';
  private manuallyAddedUsers: User[] = [];

  constructor(private http: HttpClient) {
    this.loadManuallyAddedUsers();
    this.loadUsers();
  }

  /**
   * Load manually added users from localStorage
   */
  private loadManuallyAddedUsers(): void {
    const stored = localStorage.getItem(this.STORAGE_KEY);
    if (stored) {
      try {
        this.manuallyAddedUsers = JSON.parse(stored);
      } catch (error) {
        this.manuallyAddedUsers = [];
      }
    }
  }

  /**
   * Save manually added users to localStorage
   */
  private saveManuallyAddedUsers(): void {
    try {
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(this.manuallyAddedUsers));
    } catch (error) {
      // Silent fail
    }
  }

  /**
   * Load users from JSONPlaceholder API with role mapping
   * Combines API users with manually added users
   */
  loadUsers(): void {
    this.http.get<JsonPlaceholderUser[]>(this.API_URL)
      .pipe(
        map(users => this.mapToInternalUsers(users)),
        catchError(error => {
          return this.getFallbackUsers();
        })
      )
      .subscribe(apiUsers => {
        // Combine manually added users (at the top) with API users
        const combinedUsers = [...this.manuallyAddedUsers, ...apiUsers];
        this.usersSubject.next(combinedUsers);
      });
  }

  /**
   * Map JSONPlaceholder users to our User model with role assignment
   */
  private mapToInternalUsers(apiUsers: JsonPlaceholderUser[]): User[] {
    return apiUsers.map(user => ({
      id: user.id.toString(),
      name: user.name,
      email: user.email,
      role: this.assignRole(user.id)
    }));
  }

  /**
   * Assign role based on user ID (cycling through roles)
   * This creates an even distribution: user.id % 3
   */
  private assignRole(userId: number): 'Admin' | 'Editor' | 'Viewer' {
    return this.roles[userId % 3] as 'Admin' | 'Editor' | 'Viewer';
  }

  /**
   * Add a new user (simulated POST to API)
   * New user will be added at the top of the list and persisted
   * Returns Observable that emits user or throws error if duplicate
   */
  addUser(user: Omit<User, 'id'>): Observable<User> {
    const currentUsers = this.usersSubject.value;
    
    // Check for duplicate email (case-insensitive)
    const duplicateEmail = currentUsers.find(
      u => u.email.toLowerCase() === user.email.toLowerCase()
    );
    
    if (duplicateEmail) {
      return throwError(() => ({
        type: 'duplicate',
        message: `User with email "${user.email}" already exists!`,
        field: 'email'
      }));
    }
    
    const newId = this.generateNextId(currentUsers);
    
    const newUser: User = {
      ...user,
      id: newId.toString()
    };

    // Simulate API POST (JSONPlaceholder returns fake response but simulates POST)
    return this.http.post<JsonPlaceholderUser>(this.API_URL, {
      name: user.name,
      email: user.email,
      username: user.email.split('@')[0]
    }).pipe(
      map(() => newUser),
      tap(addedUser => {
        // Add to manually added users list (persisted)
        this.manuallyAddedUsers = [addedUser, ...this.manuallyAddedUsers];
        this.saveManuallyAddedUsers();
        
        // Add new user at the beginning of the current view
        const updatedUsers = [addedUser, ...currentUsers];
        this.usersSubject.next(updatedUsers);
      }),
      catchError(error => {
        // Add to manually added users list (persisted)
        this.manuallyAddedUsers = [newUser, ...this.manuallyAddedUsers];
        this.saveManuallyAddedUsers();
        
        // Still add locally even if API fails - at the beginning
        const updatedUsers = [newUser, ...currentUsers];
        this.usersSubject.next(updatedUsers);
        return of(newUser);
      })
    );
  }

  /**
   * Generate next ID based on existing users
   */
  private generateNextId(users: User[]): number {
    if (users.length === 0) return 1;
    const maxId = Math.max(...users.map(u => parseInt(u.id) || 0));
    return maxId + 1;
  }

  /**
   * Fallback users if API fails
   */
  private getFallbackUsers(): Observable<User[]> {
    const fallbackUsers: User[] = [
      { id: '1', name: 'John Doe', email: 'john@example.com', role: 'Editor' },
      { id: '2', name: 'Jane Smith', email: 'jane@example.com', role: 'Viewer' },
      { id: '3', name: 'Bob Johnson', email: 'bob@example.com', role: 'Admin' },
      { id: '4', name: 'Alice Williams', email: 'alice@example.com', role: 'Editor' },
      { id: '5', name: 'Charlie Brown', email: 'charlie@example.com', role: 'Viewer' }
    ];
    return of(fallbackUsers);
  }

  /**
   * Refresh users from API
   */
  refreshUsers(): void {
    this.loadUsers();
  }

  /**
   * Get current users snapshot
   */
  getUsers(): User[] {
    return this.usersSubject.value;
  }

  /**
   * Clear all manually added users (for testing/debugging)
   */
  clearManuallyAddedUsers(): void {
    this.manuallyAddedUsers = [];
    localStorage.removeItem(this.STORAGE_KEY);
    this.loadUsers(); // Reload to show only API users
  }
}
