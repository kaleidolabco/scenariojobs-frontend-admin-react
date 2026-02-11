import useFetch from '../hooks/useFetch';
import { FetchResponse, successMock } from './responseType';
import useUIStore from '../store/uiStore';

// Query params
export interface PositionQueryParams {
    pagina?: number;
    items_por_pagina?: number;
    orden?: string;
    orden_por?: string;
    filtro?: string;
    unidad_id?: string;
    estado?: 'VACANTE' | 'OCUPADO';
}

// Types
export type PositionStatus = 'VACANTE' | 'OCUPADO';

export interface Position {
    id: string;
    nombre: string;
    unidad_id: string;
    unidad_nombre?: string; // For display
    cargo_id: string;
    cargo_nombre?: string; // For display
    jefe_puesto_id?: string | null;
    jefe_puesto_nombre?: string; // For display
    persona_id?: string | null;
    persona_nombre?: string; // For display
    estado: PositionStatus;
    fecha_creacion?: string;
}

// Mock Data - All 55 positions from CSV
const MOCK_POSITIONS: Position[] = [
    // Gerente General (reports to no one)
    {
        id: 'pos_13',
        nombre: 'Gerente General',
        unidad_id: 'org_1',
        unidad_nombre: 'Gerencia General',
        cargo_id: 'job_1',
        cargo_nombre: 'Gerente General',
        jefe_puesto_id: null,
        persona_id: 'per_13',
        persona_nombre: 'Juan Fernando Erazo Ramirez',
        estado: 'OCUPADO',
        fecha_creacion: '2005-01-10'
    },
    
    // ADMINISTRACION - Reports to Gerente General
    {
        id: 'pos_10',
        nombre: 'Director Administrativa',
        unidad_id: 'org_10',
        unidad_nombre: 'Dirección Administrativa',
        cargo_id: 'job_2',
        cargo_nombre: 'Director Administrativa',
        jefe_puesto_id: 'pos_13',
        jefe_puesto_nombre: 'Gerente General',
        persona_id: 'per_10',
        persona_nombre: 'Diego Alejandro Cifuentes Marin',
        estado: 'OCUPADO',
        fecha_creacion: '2010-01-15'
    },
    {
        id: 'pos_9',
        nombre: 'Lider Talento Humano',
        unidad_id: 'org_101',
        unidad_nombre: 'Talento Humano',
        cargo_id: 'job_8',
        cargo_nombre: 'Lider Talento Humano',
        jefe_puesto_id: 'pos_10',
        jefe_puesto_nombre: 'Director Administrativa',
        persona_id: 'per_9',
        persona_nombre: 'Claudia Fernanda Cifuentes Marin',
        estado: 'OCUPADO',
        fecha_creacion: '2021-03-01'
    },
    {
        id: 'pos_41',
        nombre: 'Analista Contable',
        unidad_id: 'org_102',
        unidad_nombre: 'Contabilidad',
        cargo_id: 'job_20',
        cargo_nombre: 'Analista Contable',
        jefe_puesto_id: 'pos_10',
        jefe_puesto_nombre: 'Director Administrativa',
        persona_id: 'per_41',
        persona_nombre: 'Yeraldin Osorio Gonzalez',
        estado: 'OCUPADO',
        fecha_creacion: '2020-07-01'
    },
    {
        id: 'pos_39',
        nombre: 'Director Gestion Organizacional',
        unidad_id: 'org_103',
        unidad_nombre: 'Gestión Organizacional',
        cargo_id: 'job_4',
        cargo_nombre: 'Director Gestion Organizacional',
        jefe_puesto_id: 'pos_10',
        jefe_puesto_nombre: 'Director Administrativa',
        persona_id: 'per_39',
        persona_nombre: 'Carolina Ordoñez Lopez',
        estado: 'OCUPADO',
        fecha_creacion: '2011-02-01'
    },
    {
        id: 'pos_7',
        nombre: 'Analista de Calidad y Procesos',
        unidad_id: 'org_103',
        unidad_nombre: 'Gestión Organizacional',
        cargo_id: 'job_15',
        cargo_nombre: 'Analista de Calidad y Procesos',
        jefe_puesto_id: 'pos_39',
        jefe_puesto_nombre: 'Director Gestion Organizacional',
        persona_id: 'per_7',
        persona_nombre: 'Jose Luis Castro Valderruten',
        estado: 'OCUPADO',
        fecha_creacion: '2020-02-15'
    },
    {
        id: 'pos_11',
        nombre: 'Auxiliar Servicios Generales',
        unidad_id: 'org_104',
        unidad_nombre: 'Servicios Generales',
        cargo_id: 'job_27',
        cargo_nombre: 'Auxiliar Servicios Generales',
        jefe_puesto_id: 'pos_10',
        jefe_puesto_nombre: 'Director Administrativa',
        persona_id: 'per_11',
        persona_nombre: 'Carlos Danny Duque Contreras',
        estado: 'OCUPADO',
        fecha_creacion: '2012-05-10'
    },
    {
        id: 'pos_31',
        nombre: 'Analista Administrativo',
        unidad_id: 'org_105',
        unidad_nombre: 'Administración',
        cargo_id: 'job_22',
        cargo_nombre: 'Analista Administrativo',
        jefe_puesto_id: 'pos_10',
        jefe_puesto_nombre: 'Director Administrativa',
        persona_id: 'per_31',
        persona_nombre: 'Santiago Lozano Osorio',
        estado: 'OCUPADO',
        fecha_creacion: '2021-11-01'
    },

    // COMERCIAL - Reports to Gerente General
    {
        id: 'pos_38',
        nombre: 'Director Comercial',
        unidad_id: 'org_20',
        unidad_nombre: 'Dirección Comercial',
        cargo_id: 'job_3',
        cargo_nombre: 'Director Comercial',
        jefe_puesto_id: 'pos_13',
        jefe_puesto_nombre: 'Gerente General',
        persona_id: 'per_38',
        persona_nombre: 'Ana Cristina Ocaña Guerrero',
        estado: 'OCUPADO',
        fecha_creacion: '2012-01-15'
    },
    {
        id: 'pos_2',
        nombre: 'Ingeniero Preventa',
        unidad_id: 'org_201',
        unidad_nombre: 'Preventa',
        cargo_id: 'job_13',
        cargo_nombre: 'Ingeniero Preventa',
        jefe_puesto_id: 'pos_38',
        jefe_puesto_nombre: 'Director Comercial',
        persona_id: 'per_2',
        persona_nombre: 'Yeiler Alvarez Rodriguez',
        estado: 'OCUPADO',
        fecha_creacion: '2015-03-15'
    },
    {
        id: 'pos_4',
        nombre: 'Analista de Marketing',
        unidad_id: 'org_202',
        unidad_nombre: 'Marketing',
        cargo_id: 'job_18',
        cargo_nombre: 'Analista de Marketing',
        jefe_puesto_id: 'pos_38',
        jefe_puesto_nombre: 'Director Comercial',
        persona_id: 'per_4',
        persona_nombre: 'Alejandra Arguello Holguin',
        estado: 'OCUPADO',
        fecha_creacion: '2018-05-20'
    },
    {
        id: 'pos_48',
        nombre: 'Key Account Manager',
        unidad_id: 'org_203',
        unidad_nombre: 'Cuentas Clave',
        cargo_id: 'job_7',
        cargo_nombre: 'Key Account Manager',
        jefe_puesto_id: 'pos_38',
        jefe_puesto_nombre: 'Director Comercial',
        persona_id: 'per_48',
        persona_nombre: 'Luis Miguel Rosero Mingan',
        estado: 'OCUPADO',
        fecha_creacion: '2014-06-01'
    },

    // OPERACIONES - Desarrollo Fullstack
    {
        id: 'pos_49',
        nombre: 'Lider Tecnico - Anderson Tangarife',
        unidad_id: 'org_3011',
        unidad_nombre: 'Desarrollo Fullstack',
        cargo_id: 'job_10',
        cargo_nombre: 'Lider Tecnico',
        jefe_puesto_id: 'pos_13',
        jefe_puesto_nombre: 'Gerente General',
        persona_id: 'per_49',
        persona_nombre: 'Anderson Tangarife Ortiz',
        estado: 'OCUPADO',
        fecha_creacion: '2016-08-01'
    },
    {
        id: 'pos_50',
        nombre: 'Lider Tecnico - Jaider Valencia',
        unidad_id: 'org_3011',
        unidad_nombre: 'Desarrollo Fullstack',
        cargo_id: 'job_10',
        cargo_nombre: 'Lider Tecnico',
        jefe_puesto_id: 'pos_13',
        jefe_puesto_nombre: 'Gerente General',
        persona_id: 'per_50',
        persona_nombre: 'Jaider Duvan Valencia Segura',
        estado: 'OCUPADO',
        fecha_creacion: '2023-05-01'
    },
    {
        id: 'pos_1',
        nombre: 'Desarrollador Fullstack - Carlos Acosta',
        unidad_id: 'org_3011',
        unidad_nombre: 'Desarrollo Fullstack',
        cargo_id: 'job_14',
        cargo_nombre: 'Desarrollador Fullstack',
        jefe_puesto_id: 'pos_49',
        jefe_puesto_nombre: 'Lider Tecnico - Anderson Tangarife',
        persona_id: 'per_1',
        persona_nombre: 'Carlos Alberto Acosta Angulo',
        estado: 'OCUPADO',
        fecha_creacion: '2023-06-01'
    },
    {
        id: 'pos_3',
        nombre: 'Desarrollador Fullstack - Juan Alzate',
        unidad_id: 'org_3011',
        unidad_nombre: 'Desarrollo Fullstack',
        cargo_id: 'job_14',
        cargo_nombre: 'Desarrollador Fullstack',
        jefe_puesto_id: 'pos_49',
        jefe_puesto_nombre: 'Lider Tecnico - Anderson Tangarife',
        persona_id: 'per_3',
        persona_nombre: 'Juan Camilo Alzate Murillo',
        estado: 'OCUPADO',
        fecha_creacion: '2024-01-10'
    },
    {
        id: 'pos_15',
        nombre: 'Desarrollador Fullstack - Andres Garcia',
        unidad_id: 'org_3011',
        unidad_nombre: 'Desarrollo Fullstack',
        cargo_id: 'job_14',
        cargo_nombre: 'Desarrollador Fullstack',
        jefe_puesto_id: 'pos_50',
        jefe_puesto_nombre: 'Lider Tecnico - Jaider Valencia',
        persona_id: 'per_15',
        persona_nombre: 'Andres Leonardo Garcia Yara',
        estado: 'OCUPADO',
        fecha_creacion: '2023-08-01'
    },
    {
        id: 'pos_20',
        nombre: 'Desarrollador Fullstack - Juan Gonzalez',
        unidad_id: 'org_3011',
        unidad_nombre: 'Desarrollo Fullstack',
        cargo_id: 'job_14',
        cargo_nombre: 'Desarrollador Fullstack',
        jefe_puesto_id: 'pos_50',
        jefe_puesto_nombre: 'Lider Tecnico - Jaider Valencia',
        persona_id: 'per_20',
        persona_nombre: 'Juan Pablo Gonzalez Velasco',
        estado: 'OCUPADO',
        fecha_creacion: '2023-07-01'
    },
    {
        id: 'pos_29',
        nombre: 'Aprendiz SENA - Carlos Lopez',
        unidad_id: 'org_3011',
        unidad_nombre: 'Desarrollo Fullstack',
        cargo_id: 'job_26',
        cargo_nombre: 'Aprendiz SENA',
        jefe_puesto_id: 'pos_49',
        jefe_puesto_nombre: 'Lider Tecnico - Anderson Tangarife',
        persona_id: 'per_29',
        persona_nombre: 'Carlos Alberto Lopez Criollo',
        estado: 'OCUPADO',
        fecha_creacion: '2024-01-15'
    },
    {
        id: 'pos_34',
        nombre: 'Desarrollador Fullstack - Fredy Mercado',
        unidad_id: 'org_3011',
        unidad_nombre: 'Desarrollo Fullstack',
        cargo_id: 'job_14',
        cargo_nombre: 'Desarrollador Fullstack',
        jefe_puesto_id: 'pos_49',
        jefe_puesto_nombre: 'Lider Tecnico - Anderson Tangarife',
        persona_id: 'per_34',
        persona_nombre: 'Fredy Esteban Mercado Gomez',
        estado: 'OCUPADO',
        fecha_creacion: '2022-08-01'
    },
    {
        id: 'pos_35',
        nombre: 'Desarrollador Fullstack - Cristhian Morales',
        unidad_id: 'org_3011',
        unidad_nombre: 'Desarrollo Fullstack',
        cargo_id: 'job_14',
        cargo_nombre: 'Desarrollador Fullstack',
        jefe_puesto_id: 'pos_50',
        jefe_puesto_nombre: 'Lider Tecnico - Jaider Valencia',
        persona_id: 'per_35',
        persona_nombre: 'Cristhian Andres Morales Zapata',
        estado: 'OCUPADO',
        fecha_creacion: '2023-04-01'
    },
    {
        id: 'pos_36',
        nombre: 'Desarrollador Fullstack - Andres Moreno',
        unidad_id: 'org_3011',
        unidad_nombre: 'Desarrollo Fullstack',
        cargo_id: 'job_14',
        cargo_nombre: 'Desarrollador Fullstack',
        jefe_puesto_id: 'pos_50',
        jefe_puesto_nombre: 'Lider Tecnico - Jaider Valencia',
        persona_id: 'per_36',
        persona_nombre: 'Andres Felipe Moreno Montoya',
        estado: 'OCUPADO',
        fecha_creacion: '2024-03-01'
    },
    {
        id: 'pos_44',
        nombre: 'Desarrollador Fullstack - Juan Rengifo',
        unidad_id: 'org_3011',
        unidad_nombre: 'Desarrollo Fullstack',
        cargo_id: 'job_14',
        cargo_nombre: 'Desarrollador Fullstack',
        jefe_puesto_id: 'pos_49',
        jefe_puesto_nombre: 'Lider Tecnico - Anderson Tangarife',
        persona_id: 'per_44',
        persona_nombre: 'Juan Angel Rengifo Cardenas',
        estado: 'OCUPADO',
        fecha_creacion: '2022-01-15'
    },
    {
        id: 'pos_45',
        nombre: 'Desarrollador Fullstack - Jenifer Rivera',
        unidad_id: 'org_3011',
        unidad_nombre: 'Desarrollo Fullstack',
        cargo_id: 'job_14',
        cargo_nombre: 'Desarrollador Fullstack',
        jefe_puesto_id: 'pos_50',
        jefe_puesto_nombre: 'Lider Tecnico - Jaider Valencia',
        persona_id: 'per_45',
        persona_nombre: 'Jenifer Andrea Rivera Melecio',
        estado: 'OCUPADO',
        fecha_creacion: '2020-10-01'
    },
    {
        id: 'pos_46',
        nombre: 'Desarrollador Fullstack - Diego Rojas',
        unidad_id: 'org_3011',
        unidad_nombre: 'Desarrollo Fullstack',
        cargo_id: 'job_14',
        cargo_nombre: 'Desarrollador Fullstack',
        jefe_puesto_id: 'pos_49',
        jefe_puesto_nombre: 'Lider Tecnico - Anderson Tangarife',
        persona_id: 'per_46',
        persona_nombre: 'Diego Alejandro Rojas Reina',
        estado: 'OCUPADO',
        fecha_creacion: '2022-02-01'
    },
    {
        id: 'pos_51',
        nombre: 'Desarrollador Fullstack - Abelardo Vergara',
        unidad_id: 'org_3011',
        unidad_nombre: 'Desarrollo Fullstack',
        cargo_id: 'job_14',
        cargo_nombre: 'Desarrollador Fullstack',
        jefe_puesto_id: 'pos_50',
        jefe_puesto_nombre: 'Lider Tecnico - Jaider Valencia',
        persona_id: 'per_51',
        persona_nombre: 'Abelardo Vergara Sinisterra',
        estado: 'OCUPADO',
        fecha_creacion: '2018-07-01'
    },
    {
        id: 'pos_52',
        nombre: 'Desarrollador Fullstack - Juan Vidal',
        unidad_id: 'org_3011',
        unidad_nombre: 'Desarrollo Fullstack',
        cargo_id: 'job_14',
        cargo_nombre: 'Desarrollador Fullstack',
        jefe_puesto_id: 'pos_49',
        jefe_puesto_nombre: 'Lider Tecnico - Anderson Tangarife',
        persona_id: 'per_52',
        persona_nombre: 'Juan Esteban Vidal Barona',
        estado: 'OCUPADO',
        fecha_creacion: '2024-04-01'
    },

    // QA Team
    {
        id: 'pos_17',
        nombre: 'QA - Jeffrey Gazabon',
        unidad_id: 'org_3012',
        unidad_nombre: 'QA',
        cargo_id: 'job_23',
        cargo_nombre: 'QA',
        jefe_puesto_id: 'pos_49',
        jefe_puesto_nombre: 'Lider Tecnico - Anderson Tangarife',
        persona_id: 'per_17',
        persona_nombre: 'Jeffrey Jose Gazabon Acosta',
        estado: 'OCUPADO',
        fecha_creacion: '2021-01-15'
    },

    // Infraestructura - AWS
    {
        id: 'pos_16',
        nombre: 'Ingeniero AWS - Jorge Garzon',
        unidad_id: 'org_3021',
        unidad_nombre: 'AWS',
        cargo_id: 'job_12',
        cargo_nombre: 'Ingeniero Infraestructura AWS',
        jefe_puesto_id: 'pos_13',
        jefe_puesto_nombre: 'Gerente General',
        persona_id: 'per_16',
        persona_nombre: 'Jorge Eduardo Garzon Galeano',
        estado: 'OCUPADO',
        fecha_creacion: '2022-05-01'
    },
    {
        id: 'pos_28',
        nombre: 'Ingeniero AWS - Juan Largo',
        unidad_id: 'org_3021',
        unidad_nombre: 'AWS',
        cargo_id: 'job_12',
        cargo_nombre: 'Ingeniero Infraestructura AWS',
        jefe_puesto_id: 'pos_13',
        jefe_puesto_nombre: 'Gerente General',
        persona_id: 'per_28',
        persona_nombre: 'Juan Sebastian Largo Muñoz',
        estado: 'OCUPADO',
        fecha_creacion: '2022-04-01'
    },

    // Ciberseguridad
    {
        id: 'pos_24',
        nombre: 'Analista Ciberseguridad - Joan Hurtado',
        unidad_id: 'org_3022',
        unidad_nombre: 'Ciberseguridad',
        cargo_id: 'job_21',
        cargo_nombre: 'Analista Ciberseguridad',
        jefe_puesto_id: 'pos_13',
        jefe_puesto_nombre: 'Gerente General',
        persona_id: 'per_24',
        persona_nombre: 'Joan Sebastian Hurtado Angulo',
        estado: 'OCUPADO',
        fecha_creacion: '2024-02-01'
    },

    // Soporte - Lideres
    {
        id: 'pos_22',
        nombre: 'Lider de Soporte - Rolando Hernandez',
        unidad_id: 'org_303',
        unidad_nombre: 'Soporte',
        cargo_id: 'job_9',
        cargo_nombre: 'Lider de Soporte',
        jefe_puesto_id: 'pos_13',
        jefe_puesto_nombre: 'Gerente General',
        persona_id: 'per_22',
        persona_nombre: 'Rolando Hernandez Lopez',
        estado: 'OCUPADO',
        fecha_creacion: '2019-06-01'
    },
    {
        id: 'pos_27',
        nombre: 'Lider de Soporte - Kevin Landazury',
        unidad_id: 'org_303',
        unidad_nombre: 'Soporte',
        cargo_id: 'job_9',
        cargo_nombre: 'Lider de Soporte',
        jefe_puesto_id: 'pos_13',
        jefe_puesto_nombre: 'Gerente General',
        persona_id: 'per_27',
        persona_nombre: 'Kevin Landazury Guerrero',
        estado: 'OCUPADO',
        fecha_creacion: '2020-08-01'
    },
    {
        id: 'pos_53',
        nombre: 'Lider de Soporte - Jhon Bedoya',
        unidad_id: 'org_303',
        unidad_nombre: 'Soporte',
        cargo_id: 'job_9',
        cargo_nombre: 'Lider de Soporte',
        jefe_puesto_id: 'pos_13',
        jefe_puesto_nombre: 'Gerente General',
        persona_id: 'per_53',
        persona_nombre: 'Jhon Steven Bedoya Ramirez',
        estado: 'OCUPADO',
        fecha_creacion: '2013-09-01'
    },

    // Mesa de Ayuda
    {
        id: 'pos_6',
        nombre: 'Analista Mesa de Ayuda - Julian Britto',
        unidad_id: 'org_3031',
        unidad_nombre: 'Mesa de Ayuda',
        cargo_id: 'job_25',
        cargo_nombre: 'Analista Mesa de Ayuda',
        jefe_puesto_id: 'pos_22',
        jefe_puesto_nombre: 'Lider de Soporte - Rolando Hernandez',
        persona_id: 'per_6',
        persona_nombre: 'Julian Britto Azcarate',
        estado: 'OCUPADO',
        fecha_creacion: '2023-09-01'
    },
    {
        id: 'pos_14',
        nombre: 'Analista Mesa de Ayuda - Jhon Escarraga',
        unidad_id: 'org_3031',
        unidad_nombre: 'Mesa de Ayuda',
        cargo_id: 'job_25',
        cargo_nombre: 'Analista Mesa de Ayuda',
        jefe_puesto_id: 'pos_27',
        jefe_puesto_nombre: 'Lider de Soporte - Kevin Landazury',
        persona_id: 'per_14',
        persona_nombre: 'Jhon Jairo Escarraga Lasprilla',
        estado: 'OCUPADO',
        fecha_creacion: '2020-06-15'
    },
    {
        id: 'pos_18',
        nombre: 'Analista Mesa de Ayuda - Jean Giron',
        unidad_id: 'org_3031',
        unidad_nombre: 'Mesa de Ayuda',
        cargo_id: 'job_25',
        cargo_nombre: 'Analista Mesa de Ayuda',
        jefe_puesto_id: 'pos_53',
        jefe_puesto_nombre: 'Lider de Soporte - Jhon Bedoya',
        persona_id: 'per_18',
        persona_nombre: 'Jean Sebastian Giron Montes',
        estado: 'OCUPADO',
        fecha_creacion: '2022-09-01'
    },
    {
        id: 'pos_19',
        nombre: 'Analista Mesa de Ayuda - Duvan Gongora',
        unidad_id: 'org_3031',
        unidad_nombre: 'Mesa de Ayuda',
        cargo_id: 'job_25',
        cargo_nombre: 'Analista Mesa de Ayuda',
        jefe_puesto_id: 'pos_22',
        jefe_puesto_nombre: 'Lider de Soporte - Rolando Hernandez',
        persona_id: 'per_19',
        persona_nombre: 'Duvan Dario Gongora Quiñonez',
        estado: 'OCUPADO',
        fecha_creacion: '2023-03-01'
    },
    {
        id: 'pos_21',
        nombre: 'Analista Mesa de Ayuda - Jorge Guerra',
        unidad_id: 'org_3031',
        unidad_nombre: 'Mesa de Ayuda',
        cargo_id: 'job_25',
        cargo_nombre: 'Analista Mesa de Ayuda',
        jefe_puesto_id: 'pos_27',
        jefe_puesto_nombre: 'Lider de Soporte - Kevin Landazury',
        persona_id: 'per_21',
        persona_nombre: 'Jorge Julian Guerra Riaño',
        estado: 'OCUPADO',
        fecha_creacion: '2022-10-01'
    },
    {
        id: 'pos_25',
        nombre: 'Analista Mesa de Ayuda - Johan Hurtado',
        unidad_id: 'org_3031',
        unidad_nombre: 'Mesa de Ayuda',
        cargo_id: 'job_25',
        cargo_nombre: 'Analista Mesa de Ayuda',
        jefe_puesto_id: 'pos_53',
        jefe_puesto_nombre: 'Lider de Soporte - Jhon Bedoya',
        persona_id: 'per_25',
        persona_nombre: 'Johan Esti Hurtado Orobio',
        estado: 'OCUPADO',
        fecha_creacion: '2021-10-01'
    },
    {
        id: 'pos_37',
        nombre: 'Analista Mesa de Ayuda - Marly Muñoz',
        unidad_id: 'org_3031',
        unidad_nombre: 'Mesa de Ayuda',
        cargo_id: 'job_25',
        cargo_nombre: 'Analista Mesa de Ayuda',
        jefe_puesto_id: 'pos_22',
        jefe_puesto_nombre: 'Lider de Soporte - Rolando Hernandez',
        persona_id: 'per_37',
        persona_nombre: 'Marly Yuliana Muñoz Pelaez',
        estado: 'OCUPADO',
        fecha_creacion: '2022-06-01'
    },
    {
        id: 'pos_42',
        nombre: 'Analista Mesa de Ayuda - Jasson Oviedo',
        unidad_id: 'org_3031',
        unidad_nombre: 'Mesa de Ayuda',
        cargo_id: 'job_25',
        cargo_nombre: 'Analista Mesa de Ayuda',
        jefe_puesto_id: 'pos_27',
        jefe_puesto_nombre: 'Lider de Soporte - Kevin Landazury',
        persona_id: 'per_42',
        persona_nombre: 'Jasson Alexander Oviedo Lucano',
        estado: 'OCUPADO',
        fecha_creacion: '2022-03-01'
    },

    // Help Desk
    {
        id: 'pos_12',
        nombre: 'Analista Help Desk - Camilo Enciso',
        unidad_id: 'org_3032',
        unidad_nombre: 'Help Desk',
        cargo_id: 'job_24',
        cargo_nombre: 'Analista Help Desk',
        jefe_puesto_id: 'pos_22',
        jefe_puesto_nombre: 'Lider de Soporte - Rolando Hernandez',
        persona_id: 'per_12',
        persona_nombre: 'Camilo Andres Enciso Rojas',
        estado: 'OCUPADO',
        fecha_creacion: '2019-04-01'
    },
    {
        id: 'pos_55',
        nombre: 'Analista Help Desk - Camilo Enciso 2',
        unidad_id: 'org_3032',
        unidad_nombre: 'Help Desk',
        cargo_id: 'job_24',
        cargo_nombre: 'Analista Help Desk',
        jefe_puesto_id: 'pos_27',
        jefe_puesto_nombre: 'Lider de Soporte - Kevin Landazury',
        persona_id: 'per_55',
        persona_nombre: 'Camilo Andres Enciso Rojas',
        estado: 'OCUPADO',
        fecha_creacion: '2019-04-01'
    },

    // Soporte Especializado
    {
        id: 'pos_5',
        nombre: 'Ingeniero Soporte Especializado - Johan Asprilla',
        unidad_id: 'org_3033',
        unidad_nombre: 'Soporte Especializado',
        cargo_id: 'job_11',
        cargo_nombre: 'Ingeniero de Soporte Especializado',
        jefe_puesto_id: 'pos_22',
        jefe_puesto_nombre: 'Lider de Soporte - Rolando Hernandez',
        persona_id: 'per_5',
        persona_nombre: 'Johan Asprilla Quiñonez',
        estado: 'OCUPADO',
        fecha_creacion: '2017-08-10'
    },
    {
        id: 'pos_8',
        nombre: 'Ingeniero Soporte Especializado - Edier Castro',
        unidad_id: 'org_3033',
        unidad_nombre: 'Soporte Especializado',
        cargo_id: 'job_11',
        cargo_nombre: 'Ingeniero de Soporte Especializado',
        jefe_puesto_id: 'pos_27',
        jefe_puesto_nombre: 'Lider de Soporte - Kevin Landazury',
        persona_id: 'per_8',
        persona_nombre: 'Edier Johan Castro Vargas',
        estado: 'OCUPADO',
        fecha_creacion: '2022-07-01'
    },

    // Proyectos
    {
        id: 'pos_30',
        nombre: 'Director de Proyectos - Leonardo Lopez',
        unidad_id: 'org_304',
        unidad_nombre: 'Proyectos',
        cargo_id: 'job_5',
        cargo_nombre: 'Director de Proyectos',
        jefe_puesto_id: 'pos_13',
        jefe_puesto_nombre: 'Gerente General',
        persona_id: 'per_30',
        persona_nombre: 'Leonardo Pablo Lopez Zuluaga',
        estado: 'OCUPADO',
        fecha_creacion: '2008-03-01'
    },
    {
        id: 'pos_32',
        nombre: 'Director de Proyectos - John Marin',
        unidad_id: 'org_304',
        unidad_nombre: 'Proyectos',
        cargo_id: 'job_5',
        cargo_nombre: 'Director de Proyectos',
        jefe_puesto_id: 'pos_13',
        jefe_puesto_nombre: 'Gerente General',
        persona_id: 'per_32',
        persona_nombre: 'John Fredy Marin Cortazar',
        estado: 'OCUPADO',
        fecha_creacion: '2010-06-01'
    },
    {
        id: 'pos_40',
        nombre: 'Director de Proyectos - Luz Ortiz',
        unidad_id: 'org_304',
        unidad_nombre: 'Proyectos',
        cargo_id: 'job_5',
        cargo_nombre: 'Director de Proyectos',
        jefe_puesto_id: 'pos_13',
        jefe_puesto_nombre: 'Gerente General',
        persona_id: 'per_40',
        persona_nombre: 'Luz Mayerlin Ortiz Florez',
        estado: 'OCUPADO',
        fecha_creacion: '2021-05-01'
    },

    // Soluciones
    {
        id: 'pos_54',
        nombre: 'Director Soluciones - Ana Aranda',
        unidad_id: 'org_305',
        unidad_nombre: 'Soluciones',
        cargo_id: 'job_6',
        cargo_nombre: 'Director Soluciones',
        jefe_puesto_id: 'pos_13',
        jefe_puesto_nombre: 'Gerente General',
        persona_id: 'per_54',
        persona_nombre: 'Ana Cristina Aranda Castrillon',
        estado: 'OCUPADO',
        fecha_creacion: '2009-05-01'
    },

    // Operaciones
    {
        id: 'pos_23',
        nombre: 'Analista de Operaciones - Andres Hernandez',
        unidad_id: 'org_306',
        unidad_nombre: 'Operaciones',
        cargo_id: 'job_19',
        cargo_nombre: 'Analista de Operaciones',
        jefe_puesto_id: 'pos_13',
        jefe_puesto_nombre: 'Gerente General',
        persona_id: 'per_23',
        persona_nombre: 'Andres Felipe Hernandez Polindara',
        estado: 'OCUPADO',
        fecha_creacion: '2022-11-01'
    },
    {
        id: 'pos_26',
        nombre: 'Analista de Especialistas - Ivan Hurtado',
        unidad_id: 'org_306',
        unidad_nombre: 'Operaciones',
        cargo_id: 'job_17',
        cargo_nombre: 'Analista de Especialistas',
        jefe_puesto_id: 'pos_13',
        jefe_puesto_nombre: 'Gerente General',
        persona_id: 'per_26',
        persona_nombre: 'Ivan Dario Hurtado Quintero',
        estado: 'OCUPADO',
        fecha_creacion: '2022-12-01'
    },
    {
        id: 'pos_33',
        nombre: 'Analista de Operaciones - Jhon Marin',
        unidad_id: 'org_306',
        unidad_nombre: 'Operaciones',
        cargo_id: 'job_19',
        cargo_nombre: 'Analista de Operaciones',
        jefe_puesto_id: 'pos_13',
        jefe_puesto_nombre: 'Gerente General',
        persona_id: 'per_33',
        persona_nombre: 'Jhon Alexis Marin Rodriguez',
        estado: 'OCUPADO',
        fecha_creacion: '2018-09-01'
    },
    {
        id: 'pos_43',
        nombre: 'Analista de Especialistas - Kevin Ramirez',
        unidad_id: 'org_306',
        unidad_nombre: 'Operaciones',
        cargo_id: 'job_17',
        cargo_nombre: 'Analista de Especialistas',
        jefe_puesto_id: 'pos_13',
        jefe_puesto_nombre: 'Gerente General',
        persona_id: 'per_43',
        persona_nombre: 'Kevin Andres Ramirez Guzman',
        estado: 'OCUPADO',
        fecha_creacion: '2021-02-01'
    },

    // DIAGEO
    {
        id: 'pos_47',
        nombre: 'Analista de Datos - Javier Roncancio',
        unidad_id: 'org_401',
        unidad_nombre: 'Análisis de Datos',
        cargo_id: 'job_16',
        cargo_nombre: 'Analista de Datos',
        jefe_puesto_id: 'pos_13',
        jefe_puesto_nombre: 'Gerente General',
        persona_id: 'per_47',
        persona_nombre: 'Javier Antonio Roncancio Cuellar',
        estado: 'OCUPADO',
        fecha_creacion: '2016-04-01'
    }
];

export const usePositionService = () => {
    const { fetchData, loading, error } = useFetch<FetchResponse>();
    const { openAlert } = useUIStore();

    const getPositions = async (params?: PositionQueryParams): Promise<FetchResponse | null> => {
        try {
            let filteredPositions = [...MOCK_POSITIONS];

            // Apply filters
            if (params?.unidad_id) {
                filteredPositions = filteredPositions.filter(p => p.unidad_id === params.unidad_id);
            }
            if (params?.estado) {
                filteredPositions = filteredPositions.filter(p => p.estado === params.estado);
            }
            if (params?.filtro) {
                const searchTerm = params.filtro.toLowerCase();
                filteredPositions = filteredPositions.filter(p =>
                    p.nombre.toLowerCase().includes(searchTerm) ||
                    p.cargo_nombre?.toLowerCase().includes(searchTerm) ||
                    p.persona_nombre?.toLowerCase().includes(searchTerm)
                );
            }

            // Sorting
            if (params?.orden_por) {
                filteredPositions.sort((a, b) => {
                    const aVal = (a as any)[params.orden_por!] || '';
                    const bVal = (b as any)[params.orden_por!] || '';
                    const comparison = aVal > bVal ? 1 : -1;
                    return params.orden === 'desc' ? -comparison : comparison;
                });
            }

            // Pagination
            const page = params?.pagina || 1;
            const pageSize = params?.items_por_pagina || 10;
            const start = (page - 1) * pageSize;
            const paginatedPositions = filteredPositions.slice(start, start + pageSize);

            const response = successMock({
                puestos: paginatedPositions,
                paginacion: {
                    total_items: filteredPositions.length,
                    total_paginas: Math.ceil(filteredPositions.length / pageSize),
                    cantidad_por_pagina: pageSize,
                    pagina_actual: page
                }
            });

            return (await fetchData({
                url: '/api/positions',
                params: params as any,
                mockData: response
            })) as FetchResponse | null;
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : String(error);
            openAlert(errorMessage, 'error');
            return null;
        }
    };

    const getPositionById = async (id: string): Promise<FetchResponse | null> => {
        try {
            const position = MOCK_POSITIONS.find(p => p.id === id);
            if (!position) {
                throw new Error('Puesto no encontrado');
            }

            return (await fetchData({
                url: `/api/positions/${id}`,
                mockData: successMock({ puesto: position })
            })) as FetchResponse | null;
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : String(error);
            openAlert(errorMessage, 'error');
            return null;
        }
    };

    const createPosition = async (position: Omit<Position, 'id' | 'estado'>): Promise<FetchResponse | null> => {
        try {
            const newPosition = {
                ...position,
                id: Math.random().toString(36).substr(2, 9),
                estado: 'VACANTE' as PositionStatus
            };
            return (await fetchData({
                url: '/api/positions',
                method: 'POST',
                body: position,
                mockData: successMock({ puesto: newPosition })
            })) as FetchResponse | null;
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : String(error);
            openAlert(errorMessage, 'error');
            return null;
        }
    };

    const updatePosition = async (id: string, position: Partial<Position>): Promise<FetchResponse | null> => {
        try {
            return (await fetchData({
                url: `/api/positions/${id}`,
                method: 'PUT',
                body: position,
                mockData: successMock({ puesto: { ...position, id } })
            })) as FetchResponse | null;
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : String(error);
            openAlert(errorMessage, 'error');
            return null;
        }
    };

    const deletePosition = async (id: string): Promise<boolean> => {
        try {
            await fetchData({
                url: `/api/positions/${id}`,
                method: 'DELETE',
                mockData: successMock({ success: true })
            });
            return true;
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : String(error);
            openAlert(errorMessage, 'error');
            return false;
        }
    };

    const assignPerson = async (positionId: string, personId: string, startDate: string): Promise<FetchResponse | null> => {
        try {
            return (await fetchData({
                url: `/api/positions/${positionId}/assign`,
                method: 'POST',
                body: { persona_id: personId, fecha_inicio: startDate },
                mockData: successMock({ success: true })
            })) as FetchResponse | null;
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : String(error);
            openAlert(errorMessage, 'error');
            return null;
        }
    };

    return {
        getPositions,
        getPositionById,
        createPosition,
        updatePosition,
        deletePosition,
        assignPerson,
        loading,
        error
    };
};
