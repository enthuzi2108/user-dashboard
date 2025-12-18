import { Component, OnInit, OnDestroy, ViewChild, ElementRef, AfterViewInit } from '@angular/core';
import { trigger, transition, style, animate } from '@angular/animations';
import { MatDialog } from '@angular/material/dialog';
import { MatTableDataSource } from '@angular/material/table';
import { MatPaginator } from '@angular/material/paginator';
import { MatSort } from '@angular/material/sort';
import { MatSnackBar } from '@angular/material/snack-bar';
import { UserService } from '../services/user.service';
import { User } from '../models/user.model';
import { UserFormComponent } from '../user-form/user-form.component';
import { Subscription } from 'rxjs';
import { Chart, ChartConfiguration, registerables } from 'chart.js';

@Component({
  selector: 'app-user-dashboard',
  templateUrl: './user-dashboard.component.html',
  styleUrls: ['./user-dashboard.component.css'],
  animations: [
    trigger('fadeIn', [
      transition(':enter', [
        style({ opacity: 0 }),
        animate('300ms ease-in', style({ opacity: 1 }))
      ])
    ]),
    trigger('slideIn', [
      transition(':enter', [
        style({ transform: 'translateY(-100%)', opacity: 0 }),
        animate('300ms ease-out', style({ transform: 'translateY(0)', opacity: 1 }))
      ]),
      transition(':leave', [
        animate('300ms ease-in', style({ transform: 'translateY(-100%)', opacity: 0 }))
      ])
    ])
  ]
})
export class UserDashboardComponent implements OnInit, OnDestroy, AfterViewInit {
  dataSource: MatTableDataSource<User>;
  displayedColumns: string[] = ['name', 'email', 'role'];
  private usersSubscription?: Subscription;
  private chart?: Chart<'pie'>;
  private chartInitialized = false;
  isLoading = true;
  isAddingUser = false;

  @ViewChild(MatPaginator, { static: false }) paginator?: MatPaginator;
  @ViewChild(MatSort, { static: false }) sort?: MatSort;
  @ViewChild('chartCanvas', { static: false }) chartCanvas?: ElementRef<HTMLCanvasElement>;

  constructor(
    private userService: UserService,
    public dialog: MatDialog,
    private snackBar: MatSnackBar
  ) {
    // Register Chart.js components at initialization
    Chart.register(...registerables);
    this.dataSource = new MatTableDataSource<User>([]);
  }

  ngOnInit(): void {
    this.usersSubscription = this.userService.users$.subscribe(users => {
      this.dataSource.data = users;
      setTimeout(() => {
        this.updateChart();
        this.isLoading = false;
        // Reconnect paginator after data loads and view is ready
        this.connectPaginatorAndSort();
      }, 100);
    });
  }

  ngAfterViewInit(): void {
    // Connect paginator and sort if they're already available
    this.connectPaginatorAndSort();
    // Initialize chart after view is ready
    setTimeout(() => this.initializeChart(), 200);
  }

  private connectPaginatorAndSort(): void {
    // Use setTimeout to ensure view is fully rendered
    setTimeout(() => {
      if (this.paginator) {
        this.dataSource.paginator = this.paginator;
      }
      if (this.sort) {
        this.dataSource.sort = this.sort;
      }
    }, 0);
  }

  ngOnDestroy(): void {
    this.usersSubscription?.unsubscribe();
    this.chart?.destroy();
  }

  openModal(): void {
    const dialogRef = this.dialog.open(UserFormComponent, {
      width: '500px',
      disableClose: false,
      panelClass: 'custom-dialog-container',
      autoFocus: true
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.isAddingUser = true;
        // Subscribe to the addUser observable to handle API call
        this.userService.addUser(result).subscribe({
          next: (newUser) => {
            this.snackBar.open('User added successfully!', 'Close', {
              duration: 3000,
              horizontalPosition: 'right',
              verticalPosition: 'top',
              panelClass: ['success-snackbar']
            });
            setTimeout(() => {
              this.isAddingUser = false;
            }, 800);
          },
          error: (error) => {
            this.isAddingUser = false;
            
            if (error.type === 'duplicate') {
              // Show warning for duplicate user
              this.snackBar.open(error.message, 'Close', {
                duration: 5000,
                horizontalPosition: 'right',
                verticalPosition: 'top',
                panelClass: ['warning-snackbar']
              });
            } else {
              // Show error for other issues
              this.snackBar.open('Failed to add user. Please try again.', 'Close', {
                duration: 3000,
                horizontalPosition: 'right',
                verticalPosition: 'top',
                panelClass: ['error-snackbar']
              });
            }
          }
        });
      }
    });
  }

  applyFilter(event: Event): void {
    const filterValue = (event.target as HTMLInputElement).value;
    this.dataSource.filter = filterValue.trim().toLowerCase();

    if (this.dataSource.paginator) {
      this.dataSource.paginator.firstPage();
    }
  }

  private initializeChart(): void {
    if (this.chartCanvas && !this.chartInitialized) {
      this.createChart();
      this.chartInitialized = true;
    }
  }

  private createChart(): void {
    if (!this.chartCanvas) return;

    const ctx = this.chartCanvas.nativeElement.getContext('2d');
    if (!ctx) return;

    const data = this.calculateRoleDistribution();
    
    const config: ChartConfiguration<'pie'> = {
      type: 'pie',
      data: {
        labels: ['Admin', 'Editor', 'Viewer'],
        datasets: [{
          data: [data.admin, data.editor, data.viewer],
          backgroundColor: [
            '#1c4980', // Admin - Primary Blue (from acceptance criteria)
            '#383838', // Editor - Secondary Gray (from acceptance criteria)
            '#718096'  // Viewer - Complementary Gray
          ],
          borderColor: '#ffffff',
          borderWidth: 2
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: true,
        plugins: {
          legend: {
            display: false
          },
          tooltip: {
            enabled: true,
            backgroundColor: '#ffffff',
            titleColor: '#383838',
            bodyColor: '#383838',
            borderColor: '#e0e0e0',
            borderWidth: 1,
            padding: 12,
            cornerRadius: 4,
            displayColors: true,
            callbacks: {
              label: function(context) {
                const label = context.label || '';
                const value = context.parsed || 0;
                const total = context.dataset.data.reduce((a: number, b: any) => a + (b as number), 0);
                const percentage = ((value / total) * 100).toFixed(0);
                return `${label}: ${value} (${percentage}%)`;
              }
            }
          }
        }
      }
    };

    this.chart = new Chart(ctx, config);
  }

  private updateChart(): void {
    if (!this.chart) {
      if (this.chartCanvas && !this.chartInitialized) {
        this.initializeChart();
      }
      return;
    }

    const data = this.calculateRoleDistribution();
    this.chart.data.datasets[0].data = [data.admin, data.editor, data.viewer];
    this.chart.update('active');
  }

  private calculateRoleDistribution(): { admin: number; editor: number; viewer: number } {
    const distribution = { admin: 0, editor: 0, viewer: 0 };
    
    this.dataSource.data.forEach(user => {
      switch (user.role) {
        case 'Admin':
          distribution.admin++;
          break;
        case 'Editor':
          distribution.editor++;
          break;
        case 'Viewer':
          distribution.viewer++;
          break;
      }
    });

    return distribution;
  }

  getRolePercentage(role: string): number {
    const total = this.dataSource.data.length;
    if (total === 0) return 0;
    
    const count = this.dataSource.data.filter(user => user.role === role).length;
    return Math.round((count / total) * 100);
  }

  hasData(): boolean {
    return this.dataSource.filteredData.length > 0;
  }

  refreshUsers(): void {
    this.userService.refreshUsers();
  }
}
