import { Component, inject } from '@angular/core';
import { AuthService } from '../../../services/auth';
import { UtilsModule } from '../../../utils.module';

@Component({
  selector: 'app-dashboard',
  imports: [UtilsModule],
  templateUrl: './dashboard.html',
  styleUrl: './dashboard.css'
})
export class Dashboard {
 authService = inject(AuthService);
}
