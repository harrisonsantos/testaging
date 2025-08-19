'use client'

import React, {useEffect, useMemo, useState} from 'react';
import { useParams, useRouter } from 'next/navigation';
import PageBreadcrumb from "@/components/common/PageBreadCrumb";
import { LineChart, ArrowLeft,  CheckCircle, Check, AlertTriangle, XCircle, AlertOctagon,} from "lucide-react";
import ReactECharts from 'echarts-for-react';
import { api } from "@/services/apiEvaluations";
import {RadarChart} from "@/components/pages/evaluations/sensor-data/RadarChart";
import ContinuityChart from "@/components/pages/evaluations/sensor-data/ContinuityChart";
import { Award } from 'lucide-react';
import {useSession} from "next-auth/react";
import {BarChart} from "@/components/pages/evaluations/sensor-data/BarChart";
import {FadigaAreaChart} from "@/components/pages/evaluations/sensor-data/FadigaAreaChart";

export default function SensorDataPage() {
    const { id } = useParams();
    const router = useRouter();
    const [noData, setNoData] = useState(false);
    const [evaluationDetails, setEvaluationDetails] = useState(null);
    const [labelColor, setLabelColor] = useState('#000');
    const [sensorData, setSensorData] = useState([]);
    const { data: session, status } = useSession();
    const isLoading = status === 'loading' || (id && (!evaluationDetails || !sensorData.length));
    const user = session?.user;
    const profile = session?.user?.profile;
    const isPatient = profile === 'patient';
    const [allEvaluations, setAllEvaluations] = useState([]);

    const iconePorClassificacao = {
        "Excelente": <CheckCircle className="w-5 h-5 text-green-600" />,
        "Bom": <Check className="w-5 h-5 text-blue-600" />,
        "Regular": <AlertTriangle className="w-5 h-5 text-yellow-600" />,
        "Ruim": <XCircle className="w-5 h-5 text-orange-600" />,
        "Crítico": <AlertOctagon className="w-5 h-5 text-red-600" />,
        "N/A": <AlertTriangle className="w-5 h-5 text-gray-500" />,
    };

    const corDeFundo = {
        "Excelente": "bg-green-50 text-green-800",
        "Bom": "bg-blue-50 text-blue-800",
        "Regular": "bg-yellow-50 text-yellow-800",
        "Ruim": "bg-orange-50 text-orange-800",
        "Crítico": "bg-red-50 text-red-800",
        "N/A": "bg-gray-50 text-gray-600",
    };

    const updateLabelColor = () => {
        const isDark = document.documentElement.classList.contains('dark');
        setLabelColor(isDark ? '#fff' : '#000');
    };

    const [analytics, setAnalytics] = useState(null);

    useEffect(() => {
        updateLabelColor();
        const observer = new MutationObserver(updateLabelColor);
        observer.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });
        return () => observer.disconnect();
    }, []);


    useEffect(() => {
        const fetchData = async () => {
            try {
                const [data, details, an] = await Promise.all([
                  api.getSensorData(id),
                  api.getEvaluationDetails(id),
                  api.getAnalytics(id),
                ]);
                setEvaluationDetails(details);
                setSensorData(data);
                setAnalytics(an);
                if (!data || data.length === 0) setNoData(true);
            } catch (err) {
                console.error(err);
                setNoData(true);
            }
        };
        if (id) fetchData();
    }, [id]);


    useEffect(() => {
        const fetchAllEvaluations = async () => {
            try {
                const data = await api.getEvaluations();
                setAllEvaluations(data);
            } catch (error) {
                console.error('Erro ao buscar todas as avaliações:', error);
            }
        };
        fetchAllEvaluations();
    }, []);

    const chartOptions = useMemo(() => {
        if (!sensorData.length) return { accel: null, gyro: null };

        const labels = [], accelX = [], accelY = [], accelZ = [], gyroX = [], gyroY = [], gyroZ = [];

        sensorData.forEach(item => {
            const t = new Date(item.time);
            const label = `${t.getHours().toString().padStart(2, '0')}:${t.getMinutes().toString().padStart(2, '0')}:${t.getSeconds().toString().padStart(2, '0')}`;
            labels.push(label);
            accelX.push(item.accel_x);
            accelY.push(item.accel_y);
            accelZ.push(item.accel_z);
            gyroX.push(item.gyro_x);
            gyroY.push(item.gyro_y);
            gyroZ.push(item.gyro_z);
        });

        const baseOptions = {
            tooltip: { trigger: 'axis' },
            legend: { top: 'top', right: 'center', textStyle: { color: labelColor } },
            xAxis: {
                type: 'category',
                data: labels,
                boundaryGap: false,
                axisLabel: { color: labelColor },
            },
            yAxis: {
                type: 'value',
                splitLine: { show: true, lineStyle: { type: 'dashed' } },
                axisLabel: { color: labelColor },
            },
            dataZoom: [
                { type: 'inside', throttle: 50 },
                { type: 'slider', height: 20, bottom: 10 }
            ],
            toolbox: {
                feature: { restore: { title: 'Resetar', show: true } },
                top: 10,
                right: 20,
            },
            backgroundColor: 'transparent',
            textStyle: { color: labelColor },
        };

        return {
            accel: {
                ...baseOptions,
                title: { text: 'Acelerômetro', left: 'left', textStyle: { color: labelColor } },
                series: [
                    { name: 'Accel X', type: 'line', data: accelX, smooth: true },
                    { name: 'Accel Y', type: 'line', data: accelY, smooth: true },
                    { name: 'Accel Z', type: 'line', data: accelZ, smooth: true },
                ]
            },
            gyro: {
                ...baseOptions,
                title: { text: 'Giroscópio', left: 'left', textStyle: { color: labelColor } },
                series: [
                    { name: 'Gyro X', type: 'line', data: gyroX, smooth: true },
                    { name: 'Gyro Y', type: 'line', data: gyroY, smooth: true },
                    { name: 'Gyro Z', type: 'line', data: gyroZ, smooth: true },
                ]
            },
        };
    }, [sensorData, labelColor]);

    const InfoItem = ({ label, value }) => (
        <div>
            <p className="mb-1 text-xs text-gray-500 dark:text-gray-400">{label}</p>
            <p className="text-sm font-medium text-gray-800 dark:text-white/90">{value ?? "Sem informações"}</p>
        </div>
    );

    function formatCpf(value) {
        if (!value) return '';
        return value
            .replace(/\D/g, '')
            .replace(/(\d{3})(\d)/, '$1.$2')
            .replace(/(\d{3})(\d)/, '$1.$2')
            .replace(/(\d{3})(\d{1,2})$/, '$1-$2');
    }

    const formatDateBr = (dateStr) => {
        if (!dateStr) return 'Sem informação';
        const date = new Date(dateStr);
        return date.toLocaleDateString('pt-BR');
    };



    function calcularIdadeAnos(nascimento, dataRef) {
        const nasc = new Date(nascimento);
        const ref = new Date(dataRef);
        let idade = ref.getFullYear() - nasc.getFullYear();
        const m = ref.getMonth() - nasc.getMonth();
        if (m < 0 || (m === 0 && ref.getDate() < nasc.getDate())) idade--;
        return idade;
    }

    function tempoStringParaSegundos(tempoStr) {
        const [h, m, s] = tempoStr.split(':').map(Number);
        return h * 3600 + m * 60 + s;
    }


    function tempoStringParaMinutos(tempoStr) {
        return tempoStringParaSegundos(tempoStr) / 60;
    }



    if (isLoading) {
        return (
            <div className="p-2 space-y-4 animate-pulse">
                <div className="h-6 w-48 bg-gray-200 dark:bg-gray-800 rounded" />
                <div className="h-5 w-32 bg-gray-200 dark:bg-gray-800 rounded" />
                <div className="h-[320px] w-full bg-gray-200 dark:bg-gray-800 rounded-xl" />
                <div className="h-[320px] w-full bg-gray-200 dark:bg-gray-800 rounded-xl" />
                <div className="h-[240px] w-full bg-gray-200 dark:bg-gray-800 rounded-xl" />
                <div className="h-[400px] w-full bg-gray-200 dark:bg-gray-800 rounded-xl" />
            </div>
        );
    }

    const limiar = 1.0;
    const potencias = [];

    for (let i = 1; i < sensorData.length - 1; i++) {
        const prev = sensorData[i - 1].accel_z;
        const curr = sensorData[i].accel_z;
        const next = sensorData[i + 1].accel_z;

        if (curr > prev && curr > next && curr > limiar) {
            potencias.push(curr);
        }
    }

    return (
        <div className="p-2 space-y-4">
            <PageBreadcrumb
                items={[
                    { label: "Home", href: "/home" },
                    { label: "Avaliações", href: "/evaluations" },
                    { label: "Dados dos sensores" },
                ]}
            />
            <a
                href="/evaluations"
                className="mb-4 inline-flex items-center gap-2 text-sm text-gray-600 hover:text-gray-800 dark:text-gray-400 dark:hover:text-white"
            >
                <ArrowLeft className="w-4 h-4" />
                Voltar
            </a>

            {evaluationDetails && (
                <div className="rounded-xl border border-gray-200 bg-white p-4 dark:border-gray-800 dark:bg-white/[0.03] space-y-6">
                    <div>
                        <h4 className="text-lg font-semibold mb-2 text-gray-800 dark:text-white/90">Informações da Avaliação</h4>
                        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2 lg:gap-3 2xl:gap-x-32">
                            <InfoItem label="Tipo" value={evaluationDetails.type} />
                            <InfoItem label="Data" value={new Date(evaluationDetails.date).toLocaleString('pt-BR')} />
                            <InfoItem label="Tempo Total" value={evaluationDetails.totalTime} />
                            <InfoItem label="Unidade de Saúde" value={evaluationDetails.healthUnit?.name} />
                        </div>
                    </div>

                    <div>
                        <h4 className="text-lg font-semibold mb-2 text-gray-800 dark:text-white/90">Informações do Paciente</h4>
                        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2 lg:gap-3 2xl:gap-x-32">
                            <InfoItem label="Nome" value={evaluationDetails.patient?.name} />
                            <InfoItem label="CPF" value={formatCpf(evaluationDetails?.cpfPatient)} />
                            <InfoItem label="Sexo" value={evaluationDetails.patient?.gender === 'M' ? 'Masculino' : 'Feminino'} />
                            <InfoItem label="Data de Nascimento" value={formatDateBr(evaluationDetails.patient?.dateOfBirth)} />
                            <InfoItem label="Peso" value={evaluationDetails.patient?.weight ? `${evaluationDetails.patient.weight} kg` : undefined} />
                            <InfoItem label="Altura" value={evaluationDetails.patient?.height ? `${evaluationDetails.patient.height} cm` : undefined} />
                            <InfoItem label="Telefone" value={evaluationDetails.patient?.phone ? `${evaluationDetails.patient.phone}` : undefined} />
                        </div>
                    </div>

                    <div>
                        <h4 className="text-lg font-semibold mb-2 text-gray-800 dark:text-white/90">Informações do Profissional</h4>
                        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2 lg:gap-3 2xl:gap-x-32">
                            <InfoItem label="Nome" value={evaluationDetails.healthProfessional?.name} />
                            <InfoItem label="CPF" value={formatCpf(evaluationDetails?.cpfHealthProfessional)} />
                            <InfoItem label="E-mail" value={evaluationDetails.healthProfessional?.email} />
                            <InfoItem label="Telefone" value={evaluationDetails.healthProfessional?.phone} />
                        </div>
                    </div>
                </div>
            )}

            {evaluationDetails && analytics?.indicators && (
                <div className="rounded-xl border border-gray-200 bg-white p-4 dark:border-gray-800 dark:bg-white/[0.03] space-y-6">
                    <div>
                        <h4 className="text-lg font-semibold mb-2 text-gray-800 dark:text-white/90">Análise Funcional do Paciente</h4>
                        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2 lg:gap-3 2xl:gap-x-32">
                            {analytics.indicators.map((item, idx) => (
                                <InfoItem label={item.name} value={item.classificacao} key={idx}/>

                            ))}
                        </div>
                    </div>
                    <div className={`flex items-center gap-3 p-4 rounded-lg ${corDeFundo[analytics.classification || 'N/A']}`}>
                        <div className="bg-white/60 p-2 rounded-full">
                            {iconePorClassificacao[analytics.classification || 'N/A']}
                        </div>
                        <div>
                            <p className="text-xs font-semibold uppercase">Classificação Geral</p>
                            <p className="text-lg font-bold">{analytics.classification || 'N/A'}</p>
                        </div>
                    </div>
                </div>
            )}
            {!isPatient && (
                <div className="rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.03]">
                <div className="px-5 py-4 sm:px-6 sm:py-5">
                    <div className="flex items-center justify-between">
                        <h3 className="flex items-center gap-2 text-base font-medium text-gray-800 dark:text-white/90">
                            <LineChart className="w-5 h-5" />
                            Dados de Sensores
                        </h3>
                    </div>
                </div>

                <div className="border-t border-gray-100 p-5 dark:border-gray-800 sm:p-6">
                    {noData ? (
                        <p className="text-center text-gray-600 dark:text-gray-300 py-10">
                            Dados dos sensores não encontrados.
                        </p>
                    ) : (
                        <>
                            {chartOptions.accel && (
                                <div className="p-10">
                                    <ReactECharts option={chartOptions.accel} style={{ height: 400 }} />
                                </div>
                            )}
                            {chartOptions.gyro && (
                                <div className="border-t border-gray-200 p-5 dark:border-gray-600 sm:p-10 ">
                                    <ReactECharts option={chartOptions.gyro} style={{ height: 400 }} />
                                </div>
                            )}
                            {evaluationDetails && evaluationDetails.patient?.dateOfBirth && evaluationDetails.date && (
                                <div className="border-t border-gray-200 p-5 dark:border-gray-600 sm:p-10 ">
                                    <ContinuityChart
                                        idadePaciente={calcularIdadeAnos(evaluationDetails.patient.dateOfBirth, evaluationDetails.date)}
                                        tempoPaciente={tempoStringParaMinutos(evaluationDetails.totalTime)}
                                        tipo={evaluationDetails.type}
                                        labelColor={labelColor}
                                    />
                                </div>
                            )}
                            {analytics?.indicators && (
                                <div className="border-t border-gray-200 p-5 dark:border-gray-600 sm:p-10 ">
                                    <RadarChart indicators={analytics.indicators} labelColor={labelColor} />
                                </div>
                            )}
                            {sensorData && evaluationDetails.type == "5TSTS" && (
                                <div className="border-t border-gray-200 p-5 dark:border-gray-600 sm:p-10 ">
                                    <FadigaAreaChart potencias={potencias} labelColor={labelColor} />
                                </div>
                            )}
                            {evaluationDetails && allEvaluations.length > 0 && (
                                <div className="border-t border-gray-200 p-5 dark:border-gray-600 sm:p-10">
                                    <BarChart
                                        evaluations={allEvaluations.filter(e => e.cpfPatient === evaluationDetails?.cpfPatient && e.type === evaluationDetails.type)}
                                        currentId={evaluationDetails.id}
                                        labelColor={labelColor}
                                    />
                                </div>
                            )}
                        </>
                    )}
                </div>
            </div>
            )}
        </div>
    );
}
