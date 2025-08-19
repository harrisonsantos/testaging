'use client';

import React, { useEffect, useState, useMemo } from 'react';
import { api } from '@/services/apiEvaluations';
import PageBreadcrumb from '@/components/common/PageBreadCrumb';
import { Users } from 'lucide-react';
import BenchmarkCharts from '@/components/pages/population-analysis/BenchmarkCharts';
import {Skeleton} from "@mui/material";

export default function PopulationAnalysisPage() {
    const [populationAnalysis, setPopulationAnalysis] = useState(null);
    const [populationBenchmarks, setPopulationBenchmarks] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchAllData = async () => {
            try {
                const [analysis, benchmarks] = await Promise.all([
                    api.getPopulationAnalysis(),
                    api.getPopulationBenchmarks()
                ]);
                
                setPopulationAnalysis(analysis);
                setPopulationBenchmarks(benchmarks);
                setLoading(false);
            } catch (err) {
                console.error('Error fetching population data:', err);
                setLoading(false);
            }
        };

        fetchAllData();
    }, []);

    // Extract indicators from backend data
    const indicadoresTUG = populationAnalysis?.averageIndicators?.TUG;
    const indicadores5TSTS = populationAnalysis?.averageIndicators?.['5TSTS'];
    
    // Extract benchmarks from backend data
    const gruposSexo = populationBenchmarks?.byGender || {};
    const gruposIdade = populationBenchmarks?.byAgeGroup || {};

    if (loading) {
        return (
            <div className="p-2 space-y-4 animate-pulse">
                <div className="h-6 w-48 bg-gray-200 dark:bg-gray-800 rounded" />
                <div className="rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.03]">
                    <div className="px-5 py-4 sm:px-6 sm:py-5">
                        <div className="h-5 w-40 bg-gray-200 dark:bg-gray-800 rounded mb-4" />
                        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3">
                            {[1, 2, 3, 4, 5].map((_, i) => (
                                <div key={i} className="space-y-2">
                                    <div className="h-20 bg-gray-200 dark:bg-gray-800 rounded" />
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
                <div className="rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.03]">
                    <div className="px-5 py-4 sm:px-6 sm:py-5">
                        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3">
                            {[1, 2, 3].map((_, i) => (
                                <div key={i} className="space-y-2">
                                    <div className="h-20 bg-gray-200 dark:bg-gray-800 rounded" />
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
                <div className="rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.03]">
                    <div className="border-t border-gray-100 dark:border-gray-800 p-5 sm:p-6 space-y-4">
                        <div className="h-5 w-48 bg-gray-200 dark:bg-gray-800 rounded" />
                        <div className="h-[400px] bg-gray-200 dark:bg-gray-800 rounded" />
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="p-4 space-y-6">
            <PageBreadcrumb
                items={[{ label: 'Home', href: '/home' }, { label: 'Análise da População' }]}
            />

            <IndicadoresMedios titulo="Análise da População - TUG" indicadores={indicadoresTUG} />
            <IndicadoresMedios titulo="Análise da População - 5TSTS" indicadores={indicadores5TSTS} is5TSTS />

            <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow dark:border-gray-800 dark:bg-white/[0.03]">
                <div className="flex items-center gap-2 mb-4">
                    <Users className="w-6 h-6 text-gray-600 dark:text-gray-300" />
                    <h2 className="text-lg font-semibold text-gray-800 dark:text-white">Benchmarking Entre Grupos</h2>
                </div>
                <BenchmarkCharts
                    gruposSexo={gruposSexo}
                    gruposIdade={gruposIdade}
                />
            </div>
        </div>
    );
}

function IndicadoresMedios({ titulo, indicadores, is5TSTS }) {
    return (
        <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow dark:border-gray-800 dark:bg-white/[0.03]">
            <div className="flex items-center gap-2 mb-4">
                <Users className="w-6 h-6 text-gray-600 dark:text-gray-300" />
                <h2 className="text-lg font-semibold text-gray-800 dark:text-white">{titulo}</h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                <IndicadorCard label="Tempo médio do teste" valor={indicadores?.tempo + ' s'} />
                <IndicadorCard label="Potência relativa média" valor={indicadores?.potencia} />
                <IndicadorCard label="Fadiga média" valor={indicadores?.fadiga} />
                {!is5TSTS && (
                    <>
                        <IndicadorCard label="Velocidade de marcha média" valor={indicadores?.velocidade + ' m/s'} />
                        <IndicadorCard label="Cadência média" valor={indicadores?.cadencia + ' passos/min'} />
                    </>
                )}
            </div>
        </div>
    );
}

function IndicadorCard({ label, valor }) {
    return (
        <div className="rounded-xl border border-gray-100 bg-gray-50 p-4 shadow-sm dark:border-gray-800 dark:bg-white/[0.02]">
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">{label}</p>
            <p className="text-lg font-bold text-gray-800 dark:text-white">{valor}</p>
        </div>
    );
}
