import { Component, signal } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { UtilsModule } from './utils.module';
@Component({
  selector: 'app-root',
  imports: [RouterOutlet, UtilsModule],
  templateUrl: './app.html',
  styleUrl: './app.css'
})
export class App {
  protected readonly title = signal('my-pos-inventory');
}
