import { Injectable } from '@nestjs/common';
import { SensorData } from '../sensorData/entities/sensor-data.entity';

export interface BiomechanicalIndicator {
  name: string;
  value: number;
  maxValue: number;
  classificacao: string;
}

export interface BiomechanicalAnalysis {
  indicators: BiomechanicalIndicator[];
  classification: string;
  summary: {
    totalTime: number;
    averagePower: number;
    fatigue: number;
    symmetry: number;
    gaitVelocity?: number;
    cadence?: number;
    balance?: number;
    transition?: number;
  };
}

@Injectable()
export class BiomechanicalCalculationsService {
  private readonly ageReferenceTable = [
    { faixa: [20, 29], TUG: [6.0, 0.9], T5STS: [8.5, 1.1] },
    { faixa: [30, 39], TUG: [6.2, 1.0], T5STS: [9.1, 1.2] },
    { faixa: [40, 49], TUG: [6.5, 1.1], T5STS: [9.9, 1.5] },
    { faixa: [50, 59], TUG: [6.7, 1.2], T5STS: [10.7, 1.6] },
    { faixa: [60, 69], TUG: [8.5, 1.2], T5STS: [11.4, 2.1] },
    { faixa: [70, 79], TUG: [9.8, 1.4], T5STS: [13.6, 2.4] },
    { faixa: [80, 200], TUG: [11.5, 2.0], T5STS: [15.9, 3.0] }
  ];

  /**
   * Calculate biomechanical indicators for sensor data
   */
  calculateBiomechanicalIndicators(
    sensorData: SensorData[],
    evaluationType: 'TUG' | '5TSTS',
    patientAge: number,
    evaluationDate: Date
  ): BiomechanicalAnalysis {
    if (!sensorData || sensorData.length === 0) {
      return {
        indicators: [],
        classification: 'N/A',
        summary: {
          totalTime: 0,
          averagePower: 0,
          fatigue: 0,
          symmetry: 0
        }
      };
    }

    // Sort sensor data by time
    const sortedData = [...sensorData].sort((a, b) => 
      new Date(a.time).getTime() - new Date(b.time).getTime()
    );

    // Calculate basic metrics
    const t0 = new Date(sortedData[0].time).getTime();
    const tN = new Date(sortedData[sortedData.length - 1].time).getTime();
    const totalTime = (tN - t0) / 1000; // seconds

    // Calculate normalized acceleration
    const accelNorm = sortedData.map(d =>
      Math.sqrt(d.accel_x ** 2 + d.accel_y ** 2 + d.accel_z ** 2)
    );

    // Calculate power metrics
    const averagePower = accelNorm.reduce((sum, v) => sum + v, 0) / accelNorm.length;
    const power = Math.sqrt(
      accelNorm.reduce((sum, v) => sum + v ** 2, 0) / accelNorm.length
    );

    // Calculate fatigue
    const fatigue = Math.sqrt(
      accelNorm.reduce((sum, v) => sum + (v - averagePower) ** 2, 0) / accelNorm.length
    );

    // Calculate symmetry
    const ladoPositivo = sortedData.filter(d => d.accel_x >= 0).length;
    const ladoNegativo = sortedData.filter(d => d.accel_x < 0).length;
    const symmetry = Math.abs(ladoPositivo - ladoNegativo) / sortedData.length;

    // Calculate time classification
    const timeClassification = this.classifyTimeByAge(totalTime, patientAge, evaluationType);

    // Calculate indicators based on evaluation type
    const indicators = evaluationType === '5TSTS' 
      ? this.calculate5TSTSIndicators(totalTime, power, fatigue, symmetry, timeClassification)
      : this.calculateTUGIndicators(sortedData, totalTime, averagePower, accelNorm, t0);

    // Calculate overall classification
    const classification = this.classifyOverallPerformance(indicators);

    // Prepare summary
    const summary = {
      totalTime,
      averagePower,
      fatigue,
      symmetry,
      ...(evaluationType === 'TUG' && {
        gaitVelocity: 3 / totalTime, // 3 meters standard distance
        cadence: this.calculateCadence(sortedData, accelNorm, averagePower, t0),
        balance: 10 - Math.min(10, sortedData.reduce((acc, d) => acc + Math.abs(d.gyro_z), 0) / sortedData.length * 10),
        transition: Math.max(...sortedData.map(d => Math.abs(d.accel_z)))
      })
    };

    return {
      indicators,
      classification,
      summary
    };
  }

  /**
   * Calculate indicators for 5TSTS (Five Times Sit-to-Stand Test)
   */
  private calculate5TSTSIndicators(
    totalTime: number,
    power: number,
    fatigue: number,
    symmetry: number,
    timeClassification: string
  ): BiomechanicalIndicator[] {
    return [
      {
        name: "Tempo",
        value: Number(totalTime.toFixed(2)),
        maxValue: 60,
        classificacao: timeClassification
      },
      {
        name: "Potência",
        value: Number(power.toFixed(2)),
        maxValue: 20,
        classificacao: this.classifyValue(power, [
          [15, Infinity, 'Excelente'],
          [12, 14.99, 'Bom'],
          [9, 11.99, 'Regular'],
          [6, 8.99, 'Ruim'],
          [0, 5.99, 'Crítico']
        ])
      },
      {
        name: "Fadiga",
        value: Number(fatigue.toFixed(2)),
        maxValue: 10,
        classificacao: this.classifyValue(fatigue, [
          [0, 2, 'Excelente'],
          [2.01, 4, 'Bom'],
          [4.01, 6, 'Regular'],
          [6.01, 8, 'Ruim'],
          [8.01, Infinity, 'Crítico']
        ])
      },
      {
        name: "Simetria",
        value: Number((symmetry * 10).toFixed(2)),
        maxValue: 10,
        classificacao: this.classifyValue(symmetry * 10, [
          [0, 2, 'Excelente'],
          [2.01, 4, 'Bom'],
          [4.01, 6, 'Regular'],
          [6.01, 8, 'Ruim'],
          [8.01, Infinity, 'Crítico']
        ])
      }
    ];
  }

  /**
   * Calculate indicators for TUG (Timed Up and Go Test)
   */
  private calculateTUGIndicators(
    sensorData: SensorData[],
    totalTime: number,
    averagePower: number,
    accelNorm: number[],
    t0: number
  ): BiomechanicalIndicator[] {
    const distance = 3; // meters standard distance
    const gaitVelocity = distance / totalTime;
    const cadence = this.calculateCadence(sensorData, accelNorm, averagePower, t0);
    const balance = 10 - Math.min(10, sensorData.reduce((acc, d) => acc + Math.abs(d.gyro_z), 0) / sensorData.length * 10);
    const transition = Math.max(...sensorData.map(d => Math.abs(d.accel_z)));

    return [
      {
        name: "Velocidade da marcha",
        value: Number(gaitVelocity.toFixed(2)),
        maxValue: 2,
        classificacao: this.classifyValue(gaitVelocity, [
          [1.2, Infinity, 'Excelente'],
          [1.0, 1.19, 'Bom'],
          [0.8, 0.99, 'Regular'],
          [0.6, 0.79, 'Ruim'],
          [0, 0.59, 'Crítico']
        ])
      },
      {
        name: "Cadência",
        value: Number(cadence.toFixed(2)),
        maxValue: 150,
        classificacao: this.classifyValue(cadence, [
          [100, Infinity, 'Excelente'],
          [80, 99.99, 'Bom'],
          [60, 79.99, 'Regular'],
          [40, 59.99, 'Ruim'],
          [0, 39.99, 'Crítico']
        ])
      },
      {
        name: "Equilíbrio",
        value: Number(balance.toFixed(1)),
        maxValue: 10,
        classificacao: this.classifyValue(balance, [
          [8, 10, 'Excelente'],
          [6, 7.99, 'Bom'],
          [4, 5.99, 'Regular'],
          [2, 3.99, 'Ruim'],
          [0, 1.99, 'Crítico']
        ])
      },
      {
        name: "Transição",
        value: Number(transition.toFixed(2)),
        maxValue: 20,
        classificacao: this.classifyValue(transition, [
          [0, 4, 'Excelente'],
          [4.01, 6, 'Bom'],
          [6.01, 8, 'Regular'],
          [8.01, 10, 'Ruim'],
          [10.01, Infinity, 'Crítico']
        ])
      }
    ];
  }

  /**
   * Calculate cadence (steps per minute)
   */
  private calculateCadence(sensorData: SensorData[], accelNorm: number[], averagePower: number, t0: number): number {
    let steps = 0;
    let lastStepTime = t0;
    const totalTime = (new Date(sensorData[sensorData.length - 1].time).getTime() - t0) / 1000;

    for (let i = 1; i < accelNorm.length - 1; i++) {
      const v = accelNorm[i];
      const t = new Date(sensorData[i].time).getTime();
      if (
        v > accelNorm[i - 1] &&
        v > accelNorm[i + 1] &&
        v > averagePower * 1.1 &&
        (t - lastStepTime) > 300 // minimum 300ms interval
      ) {
        steps++;
        lastStepTime = t;
      }
    }

    return (steps / totalTime) * 60;
  }

  /**
   * Classify time performance by age
   */
  private classifyTimeByAge(time: number, age: number, type: 'TUG' | '5TSTS'): string {
    const ref = this.ageReferenceTable.find(r => age >= r.faixa[0] && age <= r.faixa[1]);
    if (!ref) return 'Desconhecido';

    const [media, desvio] = type === 'TUG' ? ref.TUG : ref.T5STS;

    if (time <= media - desvio) return 'Excelente';
    if (time <= media + desvio) return 'Bom';
    if (time <= media + 2 * desvio) return 'Regular';
    return 'Crítico';
  }

  /**
   * Classify value based on ranges
   */
  private classifyValue(value: number, ranges: Array<[number, number, string]>): string {
    for (const [min, max, label] of ranges) {
      if (value >= min && value <= max) return label;
    }
    return 'Desconhecido';
  }

  /**
   * Classify overall performance based on indicators
   */
  private classifyOverallPerformance(indicators: BiomechanicalIndicator[]): string {
    const weights = {
      'Excelente': 5,
      'Bom': 4,
      'Regular': 3,
      'Ruim': 2,
      'Crítico': 1
    };

    const total = indicators.reduce((acc, item) => acc + (weights[item.classificacao] || 0), 0);
    const average = total / indicators.length;

    if (average >= 4.6) return 'Excelente';
    if (average >= 3.6) return 'Bom';
    if (average >= 2.6) return 'Regular';
    if (average >= 1.6) return 'Ruim';
    return 'Crítico';
  }

  /**
   * Calculate age from birth date
   */
  calculateAge(birthDate: Date, referenceDate: Date): number {
    const birth = new Date(birthDate);
    const ref = new Date(referenceDate);
    let age = ref.getFullYear() - birth.getFullYear();
    const monthDiff = ref.getMonth() - birth.getMonth();
    
    if (monthDiff < 0 || (monthDiff === 0 && ref.getDate() < birth.getDate())) {
      age--;
    }
    
    return age;
  }

  /**
   * Calculate population statistics for multiple evaluations
   */
  calculatePopulationStatistics(evaluations: any[], sensorDataMap: Record<number, SensorData[]>): any {
    const stats = {
      totalEvaluations: evaluations.length,
      byType: { TUG: 0, '5TSTS': 0 },
      byGender: { M: 0, F: 0 },
      byAgeGroup: {},
      averageIndicators: {
        TUG: { tempo: 0, potencia: 0, fadiga: 0, velocidade: 0, cadencia: 0 },
        '5TSTS': { tempo: 0, potencia: 0, fadiga: 0, simetria: 0 }
      }
    };

    let tugCount = 0;
    let t5stsCount = 0;

    evaluations.forEach(evaluation => {
      // Count by type
      if (evaluation.type === 'TUG') {
        stats.byType.TUG++;
        tugCount++;
      } else if (evaluation.type === '5TSTS') {
        stats.byType['5TSTS']++;
        t5stsCount++;
      }

      // Count by gender
      if (evaluation.patient?.gender) {
        stats.byGender[evaluation.patient.gender]++;
      }

      // Calculate indicators for this evaluation
      const sensorData = sensorDataMap[evaluation.id];
      if (sensorData && sensorData.length > 0) {
        const patientAge = evaluation.patient?.dateOfBirth 
          ? this.calculateAge(new Date(evaluation.patient.dateOfBirth), new Date(evaluation.date))
          : 0;

        const analysis = this.calculateBiomechanicalIndicators(
          sensorData,
          evaluation.type as 'TUG' | '5TSTS',
          patientAge,
          new Date(evaluation.date)
        );

        // Add to averages
        if (evaluation.type === 'TUG') {
          stats.averageIndicators.TUG.tempo += analysis.summary.totalTime;
          stats.averageIndicators.TUG.potencia += analysis.summary.averagePower;
          stats.averageIndicators.TUG.fadiga += analysis.summary.fatigue;
          stats.averageIndicators.TUG.velocidade += analysis.summary.gaitVelocity || 0;
          stats.averageIndicators.TUG.cadencia += analysis.summary.cadence || 0;
        } else if (evaluation.type === '5TSTS') {
          stats.averageIndicators['5TSTS'].tempo += analysis.summary.totalTime;
          stats.averageIndicators['5TSTS'].potencia += analysis.summary.averagePower;
          stats.averageIndicators['5TSTS'].fadiga += analysis.summary.fatigue;
          stats.averageIndicators['5TSTS'].simetria += analysis.summary.symmetry;
        }
      }
    });

    // Calculate averages
    if (tugCount > 0) {
      stats.averageIndicators.TUG.tempo = Number((stats.averageIndicators.TUG.tempo / tugCount).toFixed(2));
      stats.averageIndicators.TUG.potencia = Number((stats.averageIndicators.TUG.potencia / tugCount).toFixed(2));
      stats.averageIndicators.TUG.fadiga = Number((stats.averageIndicators.TUG.fadiga / tugCount).toFixed(2));
      stats.averageIndicators.TUG.velocidade = Number((stats.averageIndicators.TUG.velocidade / tugCount).toFixed(2));
      stats.averageIndicators.TUG.cadencia = Number((stats.averageIndicators.TUG.cadencia / tugCount).toFixed(2));
    }

    if (t5stsCount > 0) {
      stats.averageIndicators['5TSTS'].tempo = Number((stats.averageIndicators['5TSTS'].tempo / t5stsCount).toFixed(2));
      stats.averageIndicators['5TSTS'].potencia = Number((stats.averageIndicators['5TSTS'].potencia / t5stsCount).toFixed(2));
      stats.averageIndicators['5TSTS'].fadiga = Number((stats.averageIndicators['5TSTS'].fadiga / t5stsCount).toFixed(2));
      stats.averageIndicators['5TSTS'].simetria = Number((stats.averageIndicators['5TSTS'].simetria / t5stsCount).toFixed(2));
    }

    return stats;
  }
}
