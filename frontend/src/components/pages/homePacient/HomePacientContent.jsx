'use client';

import React, { useEffect, useState } from 'react';
import TopInfoCards from "@/components/pages/homePacient/TopInfoCards";
import PatientBarChart from "@/components/pages/homePacient/PatientBarChart";
import Indicators from "@/components/pages/homePacient/Indicators";
import EvaluationActivityCard from "@/components/pages/homePacient/EvaluationActivityCard";
import { useSession } from "next-auth/react";
import { api } from "@/services/apiEvaluations";
import { api as apiPerson } from "@/services/apiPerson";

export default function HomePacientContent() {
    const { data: session } = useSession();
    const [evaluations, setEvaluations] = useState([]);
    const [evaluationsByMonth, setEvaluationsByMonth] = useState(Array(12).fill(0));
    const [tempoTotal, setTempoTotal] = useState('0s');
    const [mediaDuracao, setMediaDuracao] = useState('0s');
    const [classificacaoGeral, setClassificacaoGeral] = useState('N/A');
    const [variacaoAvaliacoes, setVariacaoAvaliacoes] = useState(0);
    const [variacaoTempo, setVariacaoTempo] = useState(0);
    const [countTUG, setCountTUG] = useState(0);
    const [count5TSTS, setCount5TSTS] = useState(0);
    const [recentSeries, setRecentSeries] = useState({ tug: [], fiveTsts: [] });
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function fetchData() {
            const cpf = session?.user?.cpf;
            if (!cpf) return;

            try {
                const [evals, person, summary] = await Promise.all([
                    api.getEvaluationsByPersonCpf(cpf),
                    apiPerson.getPerfilByCpf(`patient/${cpf}`),
                    api.getSummaryByCpf(cpf),
                ]);

                let tug = 0, five = 0;
                evals.forEach(ev => {
                    if (ev.type === 'TUG') tug++;
                    if (ev.type === '5TSTS') five++;
                });
                setCountTUG(tug);
                setCount5TSTS(five);
                setEvaluations(evals);

                const mediaTug = calcularMediaMensalPorTipo(evals, 'TUG');
                const media5sts = calcularMediaMensalPorTipo(evals, '5TSTS');
                setRecentSeries({ tug: mediaTug, fiveTsts: media5sts });

                setEvaluationsByMonth(summary.countsByMonth || Array(12).fill(0));
                setTempoTotal(summary.totalTime || '0 s');
                setMediaDuracao(summary.avgDuration || '0s');
                setClassificacaoGeral(summary.classification || 'N/A');

                // Cálculo de variações
                const mesAtual = new Date().getMonth();
                const avaliacoesMesAtual = (summary.countsByMonth || [])[mesAtual] || 0;
                const avaliacoesMesAnterior = (summary.countsByMonth || [])[mesAtual - 1] || 0;
                const variacaoAval = avaliacoesMesAnterior > 0
                    ? (((avaliacoesMesAtual - avaliacoesMesAnterior) / avaliacoesMesAnterior) * 100).toFixed(0)
                    : 0;
                setVariacaoAvaliacoes(Number(variacaoAval));

                const tempoMesAtual = 0; // poderemos expor via endpoint se necessário
                const tempoMesAnterior = 0;
                const variacaoTempoCalc = tempoMesAnterior > 0
                    ? (((tempoMesAtual - tempoMesAnterior) / tempoMesAnterior) * 100).toFixed(0)
                    : 0;
                setVariacaoTempo(Number(variacaoTempoCalc));

                setLoading(false);
            } catch (err) {
                console.error("Erro ao buscar dados:", err);
                setLoading(false);
            }
        }

        fetchData();
    }, [session?.user?.cpf]);

    function calcularMediaMensalPorTipo(evals, tipo) {
        const soma = Array(12).fill(0);
        const cont = Array(12).fill(0);

        evals.forEach(ev => {
            if (ev.type === tipo) {
                const mes = new Date(ev.date).getMonth();
                soma[mes] += tempoStringParaSegundos(ev.totalTime);
                cont[mes]++;
            }
        });

        return soma.map((total, i) => cont[i] ? parseFloat((total / cont[i]).toFixed(1)) : 0);
    }

    // === Funções auxiliares ===
    // Lógicas de cálculo foram movidas para o backend (getSummaryByCpf)

    if (loading)
        return (
            <div className="grid grid-cols-12 gap-4 md:gap-6 animate-pulse">
                <div className="col-span-12 space-y-6 xl:col-span-12">
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                        {[...Array(4)].map((_, i) => (
                            <div key={i} className="h-24 rounded-xl bg-gray-200 dark:bg-gray-700" />
                        ))}
                    </div>
                </div>

                <div className="col-span-12 xl:col-span-12">
                    <div className="h-100 rounded-xl bg-gray-200 dark:bg-gray-700" />
                </div>

                <div className="col-span-12 grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <div className="h-80 rounded-xl bg-gray-200 dark:bg-gray-700" />
                    <div className="h-80 rounded-xl bg-gray-200 dark:bg-gray-700" />
                </div>
            </div>
        );


    return (
        <div className="grid grid-cols-12 gap-4 md:gap-6">
            <div className="col-span-12 space-y-12 xl:col-span-12">
                <TopInfoCards
                    total={evaluations.length}
                    tempoTotal={tempoTotal}
                    mediaDuracao={mediaDuracao}
                    classificacao={classificacaoGeral}
                    variacaoDuracao={variacaoAvaliacoes}
                    variacaoTempo={variacaoTempo}
                />
            </div>

            <div className="col-span-12 xl:col-span-12">
                <PatientBarChart data={evaluationsByMonth} />
            </div>

            <div className="col-span-12 grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Indicators countTUG={countTUG} count5TSTS={count5TSTS} />
                <EvaluationActivityCard data={recentSeries}/>
            </div>
        </div>
    );
}
