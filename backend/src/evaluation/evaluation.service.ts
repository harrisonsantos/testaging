import { Injectable, NotFoundException } from '@nestjs/common';
import { CreateEvaluationDto } from './dto/create-evaluation.dto';
import { UpdateEvaluationDto } from './dto/update-evaluation.dto';
import { Evaluation } from './entities/evaluation.entity';
import { InjectModel } from '@nestjs/sequelize';
import { Patient } from 'src/patient/entities/patient.entity';
import { HealthProfessional } from 'src/healthProfessional/entities/healthProfessional.entity';
import { HealthUnit } from 'src/healthUnit/entities/healthUnit.entity';
import { Person } from 'src/person/entities/person.entity';
import { SensorData } from 'src/sensorData/entities/sensorData.entity';
import { Op } from 'sequelize';
import { MESSAGES } from 'src/common/constants/messages';


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
    @InjectModel(Evaluation)
    private readonly evaluationModel: typeof Evaluation,
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

    const createdEvaluation = await this.evaluationModel.create(
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
    const evaluations = await this.evaluationModel.findAll({
            include: evaluationDetailsInclude,
            order: [['date', 'DESC']],
        });
        return evaluations.map(evaluation => this.formatEvaluationDetails(evaluation));
    }

  async findAllByPerson(cpf: string): Promise<Evaluation[]> {
    const evaluations = await this.evaluationModel.findAll({
      where: {
        [Op.or]: [
            { cpfHealthProfessional: cpf },
            { cpfPatient: cpf },
        ],
    },
    include: evaluationDetailsInclude,
    order: [['date', 'DESC']],
    });
    return evaluations.map(evaluation => this.formatEvaluationDetails(evaluation));
  }
  
  async findOneByPerson(cpf: string, id: number): Promise<Evaluation> {
    const evaluation = await this.evaluationModel.findOne({
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
    const evaluation = await this.evaluationModel.findByPk(id);
    if (!evaluation) {
      throw new NotFoundException('Avaliação não encontrada');
    }
    return evaluation;
  }

  async findOneWithDetails(id: number): Promise<any> {
    const evaluation = await this.evaluationModel.findOne({
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
    // Carrega avaliação com paciente para idade
    const evaluation = await this.evaluationModel.findOne({
      where: { id },
      include: [
        { model: Patient, as: 'patient', include: [{ model: Person, as: 'person' }] },
        { model: SensorData, as: 'sensorData' },
      ],
      order: [[{ model: SensorData, as: 'sensorData' }, 'time', 'ASC']],
    });

    if (!evaluation) throw new NotFoundException(MESSAGES.EVALUATION.NOT_FOUND);

    const sensorData: SensorData[] = (evaluation as any).sensorData ?? [];
    const tipo = evaluation.type as 'TUG' | '5TSTS';
    if (!sensorData.length) return { indicators: [], classification: 'N/A' };

    const t0 = new Date(sensorData[0].time).getTime();
    const tN = new Date(sensorData[sensorData.length - 1].time).getTime();
    const tempo = (tN - t0) / 1000;

    const accelNorm = sensorData.map((d) => Math.sqrt(d.accel_x ** 2 + d.accel_y ** 2 + d.accel_z ** 2));
    const media = accelNorm.reduce((sum, v) => sum + v, 0) / accelNorm.length;
    const potencia = Math.sqrt(accelNorm.reduce((sum, v) => sum + v ** 2, 0) / accelNorm.length);
    const fadiga = Math.sqrt(accelNorm.reduce((sum, v) => sum + (v - media) ** 2, 0) / accelNorm.length);
    const ladoPositivo = sensorData.filter((d) => d.accel_x >= 0).length;
    const ladoNegativo = sensorData.filter((d) => d.accel_x < 0).length;
    const simetria = Math.abs(ladoPositivo - ladoNegativo) / sensorData.length;
    const idade = evaluation.patient ? this.calcularIdade((evaluation.patient as any).dateOfBirth, evaluation.date) : 0;
    const tempoClassificacao = this.classificarTempoPorIdade(tempo, idade, tipo);

    function classificar(valor: number, faixas: Array<[number, number, string]>) {
      for (const [min, max, label] of faixas) if (valor >= min && valor <= max) return label;
      return 'Desconhecido';
    }

    let indicators: Array<{ name: string; value: number; maxValue: number; classificacao: string }> = [];
    if (tipo === '5TSTS') {
      indicators = [
        { name: 'Tempo', value: Number(tempo.toFixed(2)), maxValue: 60, classificacao: tempoClassificacao },
        { name: 'Potência', value: Number(potencia.toFixed(2)), maxValue: 20, classificacao: classificar(potencia, [[15, Infinity, 'Excelente'], [12, 14.99, 'Bom'], [9, 11.99, 'Regular'], [6, 8.99, 'Ruim'], [0, 5.99, 'Crítico']]) },
        { name: 'Fadiga', value: Number(fadiga.toFixed(2)), maxValue: 10, classificacao: classificar(fadiga, [[0, 2, 'Excelente'], [2.01, 4, 'Bom'], [4.01, 6, 'Regular'], [6.01, 8, 'Ruim'], [8.01, Infinity, 'Crítico']]) },
        { name: 'Simetria', value: Number((simetria * 10).toFixed(2)), maxValue: 10, classificacao: classificar(simetria * 10, [[0, 2, 'Excelente'], [2.01, 4, 'Bom'], [4.01, 6, 'Regular'], [6.01, 8, 'Ruim'], [8.01, Infinity, 'Crítico']]) },
      ];
    } else {
      const distancia = 3;
      const velocidade = distancia / tempo;
      let passos = 0;
      let lastStepTime = t0;
      for (let i = 1; i < accelNorm.length - 1; i++) {
        const v = accelNorm[i];
        const t = new Date((sensorData as any)[i].time).getTime();
        if (v > accelNorm[i - 1] && v > accelNorm[i + 1] && v > media * 1.1 && t - lastStepTime > 300) {
          passos++;
          lastStepTime = t;
        }
      }
      const cadencia = (passos / tempo) * 60;
      const equilibrio = 10 - Math.min(10, sensorData.reduce((acc, d) => acc + Math.abs(d.gyro_z), 0) / sensorData.length * 10);
      const transicao = Math.max(...sensorData.map((d) => Math.abs(d.accel_z)));
      indicators = [
        { name: 'Velocidade da marcha', value: Number(velocidade.toFixed(2)), maxValue: 2, classificacao: classificar(velocidade, [[1.2, Infinity, 'Excelente'], [1.0, 1.19, 'Bom'], [0.8, 0.99, 'Regular'], [0.6, 0.79, 'Ruim'], [0, 0.59, 'Crítico']]) },
        { name: 'Cadência', value: Number(cadencia.toFixed(2)), maxValue: 150, classificacao: classificar(cadencia, [[100, Infinity, 'Excelente'], [80, 99.99, 'Bom'], [60, 79.99, 'Regular'], [40, 59.99, 'Ruim'], [0, 39.99, 'Crítico']]) },
        { name: 'Equilíbrio', value: Number(equilibrio.toFixed(1)), maxValue: 10, classificacao: classificar(equilibrio, [[8, 10, 'Excelente'], [6, 7.99, 'Bom'], [4, 5.99, 'Regular'], [2, 3.99, 'Ruim'], [0, 1.99, 'Crítico']]) },
        { name: 'Transição', value: Number(transicao.toFixed(2)), maxValue: 20, classificacao: classificar(transicao, [[0, 4, 'Excelente'], [4.01, 6, 'Bom'], [6.01, 8, 'Regular'], [8.01, 10, 'Ruim'], [10.01, Infinity, 'Crítico']]) },
      ];
    }

    const classification = this.classificarDesempenhoGeral(indicators.map((i) => i.classificacao));
    return { indicators, classification };
  }

  async getSummaryByPerson(cpf: string): Promise<any> {
    const evaluations = await this.evaluationModel.findAll({ where: { [Op.or]: [{ cpfPatient: cpf }, { cpfHealthProfessional: cpf }] } });
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


  update(id: number, updateEvaluationDto: UpdateEvaluationDto) {
    return this.evaluationModel.findByPk(id).then(async (evaluation) => {
      if (!evaluation) {
        throw new NotFoundException(MESSAGES.EVALUATION.NOT_FOUND);
      }
      await evaluation.update(updateEvaluationDto as any);
      return this.findOne(evaluation.id);
    });
  }

  remove(id: number) {
    return this.evaluationModel.findByPk(id).then(async (evaluation) => {
      if (!evaluation) {
        throw new NotFoundException(MESSAGES.EVALUATION.NOT_FOUND);
      }
      await evaluation.destroy();
      return { mensagem: 'Avaliação removida com sucesso' };
    });
  }
}
