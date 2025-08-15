import { Controller, Get, UseGuards } from '@nestjs/common';
import { AuthGuard } from 'src/middlewares/auth.guard';
import { ApiBearerAuth } from '@nestjs/swagger';

@ApiBearerAuth()
@Controller('home') 
export class HomeController {

  //Garante que apenas users autenticados acessem a rota
  @Get()
  @UseGuards(AuthGuard)
  getHomePage() {
    return { mensagem: 'Bemvindo a pagina inicial!' };
  }
}
