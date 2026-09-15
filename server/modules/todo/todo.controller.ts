import { Controller, Get, Query } from '@nestjs/common';
import { TodoService } from './todo.service';
import type { ListResponse, DataCheckItem } from '@shared/api.interface';

interface TodoSummary {
  ageReminder: { total: number; items: { type: string; title: string; count: number }[] };
  medicalInsurance: { total: number; items: { type: string; title: string; count: number }[] };
  pension: { total: number; items: { type: string; title: string; count: number }[] };
  population: { total: number; items: { type: string; title: string; count: number }[] };
  status: { total: number; items: { type: string; title: string; count: number }[] };
  treatment: { total: number; items: { type: string; title: string; count: number }[] };
}

@Controller('api/todo')
export class TodoController {
  constructor(private readonly todoService: TodoService) {}

  @Get('summary')
  async getSummary(): Promise<TodoSummary> {
    return this.todoService.getSummary();
  }

  @Get('checks')
  async getChecks(
    @Query('page') page?: string,
    @Query('pageSize') pageSize?: string,
    @Query('category') category?: string,
    @Query('severity') severity?: string,
  ): Promise<ListResponse<DataCheckItem>> {
    const pageNum = page ? parseInt(page, 10) : 1;
    const pageSizeNum = pageSize ? parseInt(pageSize, 10) : 20;
    return this.todoService.getChecks(pageNum, pageSizeNum, category, severity);
  }
}