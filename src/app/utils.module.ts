import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ButtonModule } from 'primeng/button';
import { ButtonGroupModule } from 'primeng/buttongroup';
import { FloatLabelModule } from 'primeng/floatlabel';
import { PasswordModule } from 'primeng/password';
import { InputTextModule } from 'primeng/inputtext';
import { InputNumberModule } from 'primeng/inputnumber';
import { ToastModule } from 'primeng/toast';
import { CheckboxModule } from 'primeng/checkbox';
import { MessageModule } from 'primeng/message';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { MessageService } from 'primeng/api';
import { DividerModule } from 'primeng/divider';
import { MenuModule } from 'primeng/menu';
import { BreadcrumbModule } from 'primeng/breadcrumb';
import { AvatarModule } from 'primeng/avatar';
import { AvatarGroupModule } from 'primeng/avatargroup';
import { BadgeModule } from 'primeng/badge';
import { OverlayBadgeModule } from 'primeng/overlaybadge';
import { IconFieldModule } from 'primeng/iconfield';
import { InputIconModule } from 'primeng/inputicon';
import { AccordionModule } from 'primeng/accordion';
import { TagModule } from 'primeng/tag';
import { TimelineModule } from 'primeng/timeline';
import { TabsModule } from 'primeng/tabs';
import { CardModule } from 'primeng/card';
import { ProgressBar } from 'primeng/progressbar';
import { EditorModule } from 'primeng/editor';
import { ToggleButtonModule } from 'primeng/togglebutton';
import { DrawerModule } from 'primeng/drawer';
import { SelectButtonModule } from 'primeng/selectbutton';
import { PopoverModule } from 'primeng/popover';
import { RadioButtonModule } from 'primeng/radiobutton';
import { StepperModule } from 'primeng/stepper';
import { DatePickerModule } from 'primeng/datepicker';
import { FileUploadModule } from 'primeng/fileupload';
import { DialogModule } from 'primeng/dialog';
import { TableModule } from 'primeng/table';
import { PanelMenuModule } from 'primeng/panelmenu';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { SelectModule } from 'primeng/select';


@NgModule({
  declarations: [],
  imports: [
    CommonModule,
    ProgressBar
  ],
  exports: [
    SelectModule,
    ConfirmDialogModule,
    ButtonModule,
    ButtonGroupModule,
    FloatLabelModule,
    PasswordModule,
    InputTextModule,
    InputNumberModule,
    CheckboxModule,
    ToastModule,
    MessageModule,
    DividerModule,
    MenuModule,
    ReactiveFormsModule,
    FormsModule,
    BreadcrumbModule,
    AvatarGroupModule,
    AvatarModule,
    BadgeModule,
    OverlayBadgeModule,
    CommonModule,
    IconFieldModule,
    InputIconModule,
    AccordionModule,
    TagModule,
    TimelineModule,
    TabsModule,
    CardModule,
    ProgressBar,
    EditorModule,
    ToggleButtonModule,
    DrawerModule,
    SelectButtonModule,
    PopoverModule,
    RadioButtonModule,
    StepperModule,
    DatePickerModule,
    FileUploadModule,
    DialogModule,
    TableModule,
    PanelMenuModule
  ],
  providers: [
  ]
})
export class UtilsModule { }