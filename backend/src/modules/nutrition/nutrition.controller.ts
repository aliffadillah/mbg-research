import { Controller, Get, Param, Query } from '@nestjs/common';
import { NutritionService } from './nutrition.service';

@Controller('nutrition')
export class NutritionController {
  constructor(private readonly nutritionService: NutritionService) {}

  @Get()
  async findAll(
    @Query('search') search?: string,
    @Query('category') category?: string,
  ) {
    return this.nutritionService.findAll(search, category);
  }

  @Get('categories')
  async getCategories() {
    return this.nutritionService.getCategories();
  }

  @Get('menus')
  async getMenus() {
    return this.nutritionService.getMenus();
  }

  @Get('stats')
  async getStats() {
    return this.nutritionService.getStats();
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    return this.nutritionService.findOne(id);
  }
}
