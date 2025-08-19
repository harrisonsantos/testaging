import { Injectable, NotFoundException } from '@nestjs/common';
import { CreateEvaluationDto } from './dto/create-evaluation.dto';
import { UpdateEvaluationDto } from './dto/update-evaluation.dto';
import { Evaluation } from './entities/evaluation.entity';
import { Patient } from '../patient/entities/patient.entity';
import { HealthProfessional } from '../healthProfessional/entities/healthProfessional.entity';
import { HealthUnit } from '../healthUnit/entities/healthUnit.entity';
import { Person } from '../person/entities/person.entity';
import { SensorData } from '../sensorData/entities/sensorData.entity';
import { Op } from 'sequelize';
import { MESSAGES } from 'src/common/constants/messages';
import { BiomechanicalCalculationsService } from './biomechanical-calculations.service';
import { EvaluationRepository } from './evaluation.repository';

const evaluationDetailsInclude = [
    {
        model: Patient,
        as: 'patient',
        attributes: ['weight', 'height', 'dateOfBirth'],
        include: [{ model: Person, as: 'person', attributes: ['name', 'phone', 'gender'] }],
    },
    {
        model: HealthProfessional,
        as: 'healthProfessional',
        attributes: ['email'],
        include: [{ model: Person, as: 'person', attributes: ['name', 'phone'] }],
    },
    { model: HealthUnit, as: 'healthUnit', attributes: ['name'] },
    { model: SensorData, as: 'sensorData' },
];

@Injectable()
export class EvaluationService {
  constructor(
    private readonly evaluationRepository: EvaluationRepository,
    private readonly biomechanicalCalculationsService: BiomechanicalCalculationsService,
  ) { }

  private formatEvaluationDetails(evaluation: Evaluation): any {
        if (!evaluation) {
            return null;
        }

        const evaluationJson = evaluation.toJSON();

        const formattedResult = {
            ...evaluationJson,

            patient: evaluationJson.patient ? {
                name: evaluationJson.patient.person?.name,
                phone: evaluationJson.patient.person?.phone,
                gender: evaluationJson.patient.person?.gender,
                weight: evaluationJson.patient.weight,
                height: evaluationJson.patient.height,
                dateOfBirth: evaluationJson.patient.dateOfBirth,
            } : null,

            healthProfessional: evaluationJson.healthProfessional ? {
                name: evaluationJson.healthProfessional.person?.name,
                email: evaluationJson.healthProfessional.email,
                phone: evaluationJson.healthProfessional.person?.phone,
            } : null,
        };

        return formattedResult;
    }

  async create(createEvaluationDto: Partial<CreateEvaluationDto>): Promise<Evaluation> {
    const { sensorData, ...evaluationData } = createEvaluationDto;

    const createdEvaluation = await this.evaluationRepository.create(
      {
        ...evaluationData,
        sensorData: sensorData || [],
      },
      {
        include: [SensorData],
      }
    );

    return this.findOne(createdEvaluation.id);
  }

  async findAll(): Promise<Evaluation[]> {
    const evaluations = await this.evaluationRepository.findAll({
      attributes: ['id', 'type', 'date', 'totalTime'],
      include: [
        {
          model: Patient,
          as: 'patient',
          attributes: ['weight', 'height', 'dateOfBirth'],
          include: [{ model: Person, as: 'person', attributes: ['name', 'gender'] }],
        },
        {
          model: HealthProfessional,
          as: 'healthProfessional',
          attributes: ['email'],
          include: [{ model: Person, as: 'person', attributes: ['name'] }],
        },
        { model: HealthUnit, as: 'healthUnit', attributes: ['name'] },
      ],
      order: [['date', 'DESC']],
    });
    return evaluations.map(this.formatEvaluationDetails);
  }

  async findAllByPerson(cpf: string): Promise<Evaluation[]> {
    const evaluations = await this.evaluationRepository.findAll({
      where: {
        [Op.or]: [{ cpfHealthProfessional: cpf }, { cpfPatient: cpf }],
      },
      attributes: ['id', 'type', 'date', 'totalTime'],
      include: [
        {
          model: Patient,
          as: 'patient',
          attributes: ['weight', 'height', 'dateOfBirth'],
          include: [{ model: Person, as: 'person', attributes: ['name', 'gender'] }],
        },
        {
          model: HealthProfessional,
          as: 'healthProfessional',
          attributes: ['email'],
          include: [{ model: Person, as: 'person', attributes: ['name'] }],
        },
        { model: HealthUnit, as: 'healthUnit', attributes: ['name'] },
      ],
      order: [['date', 'DESC']],
    });
    return evaluations.map(this.formatEvaluationDetails);
  }
  
  async findOneByPerson(cpf: string, id: number): Promise<Evaluation> {
    const evaluation = await this.evaluationRepository.findOne({
      where: {
        [Op.or]: [
          { cpfHealthProfessional: cpf },
          { cpfPatient: cpf },
        ],
        id: id,
      },
    });
    if (!evaluation) {
      throw new NotFoundException(MESSAGES.EVALUATION.NOT_FOUND);
    }
    return evaluation;
  }

  async findOne(id: number): Promise<Evaluation> {
    const evaluation = await this.evaluationRepository.findById(id);
    if (!evaluation) {
      throw new NotFoundException('Avaliação não encontrada');
    }
    return evaluation;
  }

  async findOneWithDetails(id: number): Promise<any> {
    const evaluation = await this.evaluationRepository.findOne({
      where: { id },
      attributes: [
        'id',
        'type',
        'cpfPatient',
        'cpfHealthProfessional',
        'date',
        'totalTime',
        'id_healthUnit',
        'createdAt'
      ],
      include: [
        {
          model: Patient,
          as: 'patient',
          attributes: ["weight", "height", "dateOfBirth"],
          include: [{ model: Person, attributes: ['name', 'phone', 'gender'] }]
        },
        {
          model: HealthProfessional,
          as: 'healthProfessional',
          attributes: ['email'],
          include: [{ model: Person, attributes: ['name', 'phone'] }],
        },
        { model: HealthUnit, as: 'healthUnit', attributes: ['name'] },
      ],
    });

    if (!evaluation) {
      throw new NotFoundException(MESSAGES.EVALUATION.NOT_FOUND);
    }
    const result = {
      ...evaluation.toJSON(), // Converte o objeto Sequelize para JSON puro
      patient: {
        name: evaluation.patient.person.name,
        phone: evaluation.patient.person.phone,
        gender: evaluation.patient.person.gender,
        weight: evaluation.patient.weight,
        height: evaluation.patient.height,
        dateOfBirth: evaluation.patient.dateOfBirth
      },
      healthProfessional: {
        name: evaluation.healthProfessional.person.name,
        email: evaluation.healthProfessional.email,
        phone: evaluation.healthProfessional.person.phone
      }
    };
    delete result.patient.person;
    return result;
  }

  private tempoStringParaSegundos(tempoStr: string): number {
    const parts = tempoStr.split(':').map(Number);
    if (parts.length !== 3) return 0;
    const [h, m, s] = parts;
    return h * 3600 + m * 60 + s;
  }

  private calcularIdade(nascimento: Date | string, dataRef: Date | string): number {
    const nasc = new Date(nascimento);
    const ref = new Date(dataRef);
    let idade = ref.getFullYear() - nasc.getFullYear();
    const m = ref.getMonth() - nasc.getMonth();
    if (m < 0 || (m === 0 && ref.getDate() < nasc.getDate())) idade--;
    return idade;
  }

  private classificarTempoPorIdade(tempoSeg: number, idade: number, tipo: 'TUG' | '5TSTS'): string {
    const tabela = [
      { faixa: [20, 29], TUG: [6.0, 0.9], T5STS: [8.5, 1.1] },
      { faixa: [30, 39], TUG: [6.2, 1.0], T5STS: [9.1, 1.2] },
      { faixa: [40, 49], TUG: [6.5, 1.1], T5STS: [9.9, 1.5] },
      { faixa: [50, 59], TUG: [6.7, 1.2], T5STS: [10.7, 1.6] },
      { faixa: [60, 69], TUG: [8.5, 1.2], T5STS: [11.4, 2.1] },
      { faixa: [70, 79], TUG: [9.8, 1.4], T5STS: [13.6, 2.4] },
      { faixa: [80, 200], TUG: [11.5, 2.0], T5STS: [15.9, 3.0] },
    ];
    const ref = tabela.find((r) => idade >= r.faixa[0] && idade <= r.faixa[1]);
    if (!ref) return 'Desconhecido';
    const [media, desvio] = tipo === 'TUG' ? ref.TUG : (ref as any).T5STS;
    if (tempoSeg <= media - desvio) return 'Excelente';
    if (tempoSeg <= media + desvio) return 'Bom';
    if (tempoSeg <= media + 2 * desvio) return 'Regular';
    return 'Crítico';
  }

  private classificarDesempenhoGeral(labels: string[]): string {
    const pesos: Record<string, number> = { Excelente: 5, Bom: 4, Regular: 3, Ruim: 2, Crítico: 1 };
    if (!labels.length) return 'N/A';
    const media = labels.reduce((acc, l) => acc + (pesos[l] || 0), 0) / labels.length;
    if (media >= 4.6) return 'Excelente';
    if (media >= 3.6) return 'Bom';
    if (media >= 2.6) return 'Regular';
    if (media >= 1.6) return 'Ruim';
    return 'Crítico';
  }

  async getAnalytics(id: number): Promise<any> {
    // Load evaluation with patient for age calculation
    const evaluation = await this.evaluationRepository.findOne({
      where: { id },
      include: [
        { model: Patient, as: 'patient', include: [{ model: Person, as: 'person' }] },
        { model: SensorData, as: 'sensorData' },
      ],
      order: [[{ model: SensorData, as: 'sensorData' }, 'time', 'ASC']],
    });

    if (!evaluation) throw new NotFoundException(MESSAGES.EVALUATION.NOT_FOUND);

    const sensorData: SensorData[] = (evaluation as any).sensorData ?? [];
    const evaluationType = evaluation.type as 'TUG' | '5TSTS';
    
    if (!sensorData.length) {
      return { indicators: [], classification: 'N/A' };
    }

    // Calculate patient age
    const patientAge = evaluation.patient?.dateOfBirth 
      ? this.biomechanicalCalculationsService.calculateAge(
          new Date(evaluation.patient.dateOfBirth), 
          new Date(evaluation.date)
        )
      : 0;

    // Use the new biomechanical calculations service
    const analysis = this.biomechanicalCalculationsService.calculateBiomechanicalIndicators(
      sensorData,
      evaluationType,
      patientAge,
      new Date(evaluation.date)
    );

    return {
      indicators: analysis.indicators,
      classification: analysis.classification,
      summary: analysis.summary
    };
  }

  async getSummaryByPerson(cpf: string): Promise<any> {
    const evaluations = await this.evaluationRepository.findAll({ where: { [Op.or]: [{ cpfPatient: cpf }, { cpfHealthProfessional: cpf }] } });
    if (!evaluations.length) return { countsByMonth: Array(12).fill(0), totalTime: '0 s', avgDuration: '0s', classification: 'N/A' };

    const counts = Array(12).fill(0);
    let totalSec = 0;
    const now = new Date();
    const monthClassifications: Record<number, string[]> = {};

    for (const ev of evaluations) {
      const date = new Date((ev as any).date);
      const m = date.getMonth();
      counts[m]++;
      totalSec += this.tempoStringParaSegundos((ev as any).totalTime);
      // Sem sensorData aqui; classificação simplificada por tempo, se idade disponível não está
    }

    const tempoFormatado = totalSec >= 60 ? `${Math.round(totalSec / 60)} min` : `${totalSec} s`;
    const avgSec = totalSec / evaluations.length;
    const avgDuration = `${avgSec.toFixed(1)}s`;

    const currentMonth = now.getMonth();
    const classification = 'N/A';
    return { countsByMonth: counts, totalTime: tempoFormatado, avgDuration, classification };
  }

  async getPopulationStatistics(): Promise<any> {
    const statistics = await this.evaluationRepository.findAll({
      attributes: [
        [this.evaluationRepository.sequelize.fn('COUNT', this.evaluationRepository.sequelize.col('id')), 'totalEvaluations'],
        [this.evaluationRepository.sequelize.fn('AVG', this.evaluationRepository.sequelize.col('totalTime')), 'averageTime'],
        [this.evaluationRepository.sequelize.fn('SUM', this.evaluationRepository.sequelize.col('totalTime')), 'totalTime'],
      ],
    });
    return statistics[0];
  }

  async getPopulationBenchmarks(): Promise<any> {
    const benchmarks = await this.evaluationRepository.findAll({
      attributes: [
        'type',
        [this.evaluationRepository.sequelize.fn('AVG', this.evaluationRepository.sequelize.col('totalTime')), 'averageTime'],
      ],
      group: ['type'],
    });
    return benchmarks;
  }

  async getPopulationAnalysis(): Promise<any> {
    const analysis = await this.evaluationRepository.findAll({
      attributes: [
        'type',
        [this.evaluationRepository.sequelize.fn('COUNT', this.evaluationRepository.sequelize.col('id')), 'count'],
        [this.evaluationRepository.sequelize.fn('AVG', this.evaluationRepository.sequelize.col('totalTime')), 'averageTime'],
      ],
      group: ['type'],
    });
    return analysis;
  }

  private getAgeGroup(age: number): string {
    if (age < 30) return '20-29';
    if (age < 40) return '30-39';
    if (age < 50) return '40-49';
    if (age < 60) return '50-59';
    if (age < 70) return '60-69';
    if (age < 80) return '70-79';
    return '80+';
  }

  async update(id: number, updateEvaluationDto: UpdateEvaluationDto) {
    return this.evaluationRepository.findById(id).then(async (evaluation) => {
      if (!evaluation) {
        throw new NotFoundException(MESSAGES.EVALUATION.NOT_FOUND);
      }
      await this.evaluationRepository.update(updateEvaluationDto as any, {where: {id: id}});
      return this.findOne(evaluation.id);
    });
  }

  remove(id: number) {
    return this.evaluationRepository.findById(id).then(async (evaluation) => {
      if (!evaluation) {
        throw new NotFoundException(MESSAGES.EVALUATION.NOT_FOUND);
      }
      await this.evaluationRepository.destroy({where: {id: id}});
      return { mensagem: 'Avaliação removida com sucesso' };
    });
  }
}
