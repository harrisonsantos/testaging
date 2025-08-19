import { ApiProperty } from "@nestjs/swagger";
import { IsEnum, IsNotEmpty, IsNumber, IsString, Matches } from "class-validator";
import { CreateSensorDataDto } from "../../sensorData/dto/create-sensorData.dto";

export class CreateEvaluationDto {

    @ApiProperty({
        description: 'Specifies the type of evaluation being performed',
        example: 'TUG',
    })
    @IsNotEmpty()
    @IsEnum(["5TSTS", "TUG"])
    type: "5TSTS" | "TUG";

    @ApiProperty({
        description: 'Specifies the CPF of the health professional responsible for the evaluation',
        example: '000.111.222-33',
    })
    @IsNotEmpty()
    @IsString()
    @Matches(/^\d{3}\.\d{3}\.\d{3}-\d{2}$/, { message: 'CPF deve estar no formato 123.456.789-00' })
    cpfHealthProfessional: string;

    @ApiProperty({
        description: 'Specifies the CPF of the patient being evaluated',
        example: '000.111.222-33',
    })
    @IsNotEmpty()
    @IsString()
    @Matches(/^\d{3}\.\d{3}\.\d{3}-\d{2}$/, { message: 'CPF deve estar no formato 123.456.789-00' })
    cpfPatient: string;
    
    @ApiProperty({
        description: 'Specifies the ID of the health unit where the evaluation is being performed',
        example: 1,
    })
    @IsNotEmpty()
    @IsNumber()
    id_healthUnit: number;

    @ApiProperty({
        description: 'Specifies the date of the evaluation',
        example: '2023-10-01',
    })
    @IsNotEmpty()
    @IsString()
    date: string;

    @ApiProperty({
        description: 'Specifies the total time taken for the evaluation',
        example: '00:30:00',
    })
    @IsNotEmpty()
    @IsString()
    totalTime: string;

    sensorData?: CreateSensorDataDto[];
}
