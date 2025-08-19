'use client';

import React, { useEffect, useState, useMemo } from 'react';
import dynamic from 'next/dynamic';
import { api } from '@/services/apiEvaluations';

const ReactECharts = dynamic(() => import('echarts-for-react'), { ssr: false });

export default function BenchmarkCharts({ gruposSexo, gruposIdade }) {
    const [labelColor, setLabelColor] = useState('#000');
    
    const sexKeys = Object.keys(gruposSexo || {});
    const sexColors = { F: '#e74c3c', M: '#3498db' };

    const radarIndicatorsByType = {
        '5TSTS': [
            { name: 'Tempo', max: 60 },
            { name: 'Potência', max: 20 },
            { name: 'Fadiga', max: 10 },
            { name: 'Simetria', max: 10 },
        ],
        'TUG': [
            { name: 'Velocidade da marcha', max: 2 },
            { name: 'Cadência', max: 150 },
            { name: 'Equilíbrio', max: 10 },
            { name: 'Transição', max: 20 },
        ],
    };

    const updateLabelColor = () => {
        const isDark = document.documentElement.classList.contains('dark');
        setLabelColor(isDark ? '#fff' : '#000');
    };

    useEffect(() => {
        updateLabelColor();
        const observer = new MutationObserver(updateLabelColor);
        observer.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });
        return () => observer.disconnect();
    }, []);



    function buildBarDataBySex(type) {
        return sexKeys.map(sex => ({
            value: gruposSexo[sex]?.[type] || 0,
            itemStyle: { color: sexColors[sex] || '#95a5a6' },
        }));
    }

    function getRadarDataByType(type) {
        // Use the pre-calculated data from backend
        const ageGroups = Object.keys(gruposIdade || {});
        return ageGroups.map(group => ({
            name: group,
            value: [
                gruposIdade[group]?.[type] || 0, // Time
                0, // Power (placeholder - would need to be added to backend)
                0, // Fatigue (placeholder - would need to be added to backend)
                0, // Symmetry/Balance (placeholder - would need to be added to backend)
            ]
        }));
    }



    function getAgeFromBirth(dateOfBirth) {
        const today = new Date();
        const birthDate = new Date(dateOfBirth);
        let age = today.getFullYear() - birthDate.getFullYear();
        const m = today.getMonth() - birthDate.getMonth();
        if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
            age--;
        }
        return age;
    }



    const optionBar5TSTS = {
        title: { text: 'Tempo médio por sexo – 5TSTS', left: 'center', textStyle: { color: labelColor }},
        tooltip: {},
        xAxis: {
            type: 'category', data: sexKeys ,
            axisLabel: { color: labelColor },
        },
        yAxis: {
            type: 'value',
            axisLabel: { color: labelColor },
        },
        series: [{ name: 'Tempo médio (s)', type: 'bar', data: buildBarDataBySex('5TSTS') }],
        textStyle: { color: labelColor },
    };

    const optionBarTUG = {
        title: {
            text: 'Tempo médio por sexo – TUG',
            left: 'center',
            textStyle: { color: labelColor }
        },
        tooltip: {},
        xAxis: {
            type: 'category',
            data: sexKeys,
            axisLabel: { color: labelColor }
        },
        yAxis: {
            type: 'value',
            axisLabel: { color: labelColor }
        },
        series: [
            {
                name: 'Tempo médio (s)',
                type: 'bar',
                data: buildBarDataBySex('TUG')
            }
        ],
        textStyle: { color: labelColor }
    };

    const optionRadar5TSTS = {
        title: {
            text: 'Indicadores por faixa etária - 5TSTS',
            left: 'center',
            top: 0,
            textStyle: { color: labelColor }
        },
        tooltip: {},
        legend: {
            data: getRadarDataByType('5TSTS').map(d => d.name),
            top: 100,
            textStyle: { color: labelColor }
        },
        radar: {
            indicator: radarIndicatorsByType['5TSTS'],
            name: {
                textStyle: { color: labelColor }
            }
        },
        series: [
            {
                type: 'radar',
                data: getRadarDataByType('5TSTS')
            }
        ],
        textStyle: { color: labelColor }
    };

    const optionRadarTUG = {
        title: {
            text: 'Indicadores por faixa etária - TUG',
            left: 'center',
            top: 0,
            textStyle: { color: labelColor }
        },
        tooltip: {},
        legend: {
            data: getRadarDataByType('TUG').map(d => d.name),
            top: 100,
            textStyle: { color: labelColor }
        },
        radar: {
            indicator: radarIndicatorsByType['TUG'],
            name: {
                textStyle: { color: labelColor }
            }
        },
        series: [
            {
                type: 'radar',
                data: getRadarDataByType('TUG')
            }
        ],
        textStyle: { color: labelColor }
    };

    if (loading) {
        return <div className="p-4">Carregando análise da população...</div>;
    }

    return (
        <div className="p-4 space-y-6">
            <div className="rounded-xl bg-white dark:bg-white/[0.02] p-4 border border-gray-200 dark:border-gray-800">
                <ReactECharts option={optionBar5TSTS} style={{ height: 400 }} />
            </div>
            <div className="rounded-xl bg-white dark:bg-white/[0.02] p-4 border border-gray-200 dark:border-gray-800">
                <ReactECharts option={optionBarTUG} style={{ height: 400 }} />
            </div>
            <div className="rounded-xl bg-white dark:bg-white/[0.02] p-4 border border-gray-200 dark:border-gray-800">
                <ReactECharts option={optionRadar5TSTS} style={{ height: 400 }} />
                <ReactECharts option={optionRadarTUG} style={{ height: 400 }} />
            </div>
        </div>
    );
}
