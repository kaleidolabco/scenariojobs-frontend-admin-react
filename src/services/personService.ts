import useFetch from '../hooks/useFetch';
import { FetchResponse, successMock, errorMock } from './responseType';
import useUIStore from '../store/uiStore';

export interface Person {
    id: string;
    nombres: string;
    apellidos: string;
    email_personal?: string;
    telefono?: string;
    foto?: string;
    fecha_ingreso?: string;
    fecha_nacimiento?: string;
    departamento?: string;
    puesto_id?: string;
    puesto_nombre?: string;
    usuario_id?: string;
    usuario_email?: string; // For display purposes
    estado: 'ACTIVO' | 'INACTIVO' | 'LICENCIA';
}

export interface PersonQueryParams {
    search?: string;
    departamento?: string;
    estado?: string;
    pagina?: number;
    items_por_pagina?: number;
}

// Mock Data - All 55 employees from CSV
let MOCK_PEOPLE: Person[] = [
    {
        id: 'per_1',
        nombres: 'Carlos Alberto',
        apellidos: 'Acosta Angulo',
        email_personal: 'carlosalbertoacostaangulo53@gmail.com',
        telefono: '3173099162',
        fecha_nacimiento: '2003-02-12',
        fecha_ingreso: '2023-06-01',
        departamento: 'Desarrollo Fullstack',
        puesto_id: 'pos_1',
        puesto_nombre: 'Desarrollador Fullstack',
        usuario_id: 'usr_1',
        usuario_email: 'carlos.acosta@scenariojobs.com',
        estado: 'ACTIVO'
    },
    {
        id: 'per_2',
        nombres: 'Yeiler',
        apellidos: 'Alvarez Rodriguez',
        email_personal: 'yeiler.andres@gmail.com',
        telefono: '3185729579',
        fecha_nacimiento: '1988-11-19',
        fecha_ingreso: '2015-03-15',
        departamento: 'Preventa',
        puesto_id: 'pos_2',
        puesto_nombre: 'Ingeniero Preventa',
        usuario_id: 'usr_2',
        usuario_email: 'yeiler.alvarez@scenariojobs.com',
        estado: 'ACTIVO'
    },
    {
        id: 'per_3',
        nombres: 'Juan Camilo',
        apellidos: 'Alzate Murillo',
        email_personal: 'juan.alzatedeveloper@gmail.com',
        telefono: '3177135587',
        fecha_nacimiento: '2005-03-02',
        fecha_ingreso: '2024-01-10',
        departamento: 'Desarrollo Fullstack',
        puesto_id: 'pos_3',
        puesto_nombre: 'Desarrollador Fullstack',
        usuario_id: 'usr_3',
        usuario_email: 'juan.alzate@scenariojobs.com',
        estado: 'ACTIVO'
    },
    {
        id: 'per_4',
        nombres: 'Alejandra',
        apellidos: 'Arguello Holguin',
        email_personal: 'alejaarguelloholguin@gmail.com',
        telefono: '3183318057',
        fecha_nacimiento: '1993-03-08',
        fecha_ingreso: '2018-05-20',
        departamento: 'Marketing',
        puesto_id: 'pos_4',
        puesto_nombre: 'Analista de Marketing',
        usuario_id: 'usr_4',
        usuario_email: 'alejandra.arguello@scenariojobs.com',
        estado: 'ACTIVO'
    },
    {
        id: 'per_5',
        nombres: 'Johan',
        apellidos: 'Asprilla Quiñonez',
        email_personal: 'johanvip25@hotmail.com',
        telefono: '3127560482',
        fecha_nacimiento: '1992-06-25',
        fecha_ingreso: '2017-08-10',
        departamento: 'Soporte Especializado',
        puesto_id: 'pos_5',
        puesto_nombre: 'Ingeniero de Soporte Especializado',
        usuario_id: 'usr_5',
        usuario_email: 'johan.asprilla@scenariojobs.com',
        estado: 'ACTIVO'
    },
    {
        id: 'per_6',
        nombres: 'Julian',
        apellidos: 'Britto Azcarate',
        email_personal: 'jbrittoazcarate@gmail.com',
        telefono: '3152369260',
        fecha_nacimiento: '2003-08-14',
        fecha_ingreso: '2023-09-01',
        departamento: 'Mesa de Ayuda',
        puesto_id: 'pos_6',
        puesto_nombre: 'Analista Mesa de Ayuda',
        usuario_id: 'usr_6',
        usuario_email: 'julian.britto@scenariojobs.com',
        estado: 'ACTIVO'
    },
    {
        id: 'per_7',
        nombres: 'Jose Luis',
        apellidos: 'Castro Valderruten',
        email_personal: 'joseluiscastro808@gmail.com',
        telefono: '3187406003',
        fecha_nacimiento: '1995-08-08',
        fecha_ingreso: '2020-02-15',
        departamento: 'Gestión Organizacional',
        puesto_id: 'pos_7',
        puesto_nombre: 'Analista de Calidad y Procesos',
        usuario_id: 'usr_7',
        usuario_email: 'jose.castro@scenariojobs.com',
        estado: 'ACTIVO'
    },
    {
        id: 'per_8',
        nombres: 'Edier Johan',
        apellidos: 'Castro Vargas',
        email_personal: 'johankstro.2001@gmail.com',
        telefono: '3104669808',
        fecha_nacimiento: '2001-06-04',
        fecha_ingreso: '2022-07-01',
        departamento: 'Soporte Especializado',
        puesto_id: 'pos_8',
        puesto_nombre: 'Ingeniero de Soporte Especializado',
        usuario_id: 'usr_8',
        usuario_email: 'edier.castro@scenariojobs.com',
        estado: 'ACTIVO'
    },
    {
        id: 'per_9',
        nombres: 'Claudia Fernanda',
        apellidos: 'Cifuentes Marin',
        email_personal: 'diego1499@hotmail.com',
        telefono: '3175631423',
        fecha_nacimiento: '1999-10-14',
        fecha_ingreso: '2021-03-01',
        departamento: 'Talento Humano',
        puesto_id: 'pos_9',
        puesto_nombre: 'Lider Talento Humano',
        usuario_id: 'usr_9',
        usuario_email: 'claudia.cifuentes@scenariojobs.com',
        estado: 'ACTIVO'
    },
    {
        id: 'per_10',
        nombres: 'Diego Alejandro',
        apellidos: 'Cifuentes Marin',
        email_personal: 'claudia.cifuentes@infodeclat.com',
        telefono: '3137296297',
        fecha_nacimiento: '1974-03-27',
        fecha_ingreso: '2010-01-15',
        departamento: 'Dirección Administrativa',
        puesto_id: 'pos_10',
        puesto_nombre: 'Director Administrativa',
        usuario_id: 'usr_10',
        usuario_email: 'diego.cifuentes@scenariojobs.com',
        estado: 'ACTIVO'
    },
    {
        id: 'per_11',
        nombres: 'Carlos Danny',
        apellidos: 'Duque Contreras',
        email_personal: 'cdduque60@gmail.com',
        telefono: '3027501294',
        fecha_nacimiento: '1975-12-24',
        fecha_ingreso: '2012-05-10',
        departamento: 'Servicios Generales',
        puesto_id: 'pos_11',
        puesto_nombre: 'Auxiliar Servicios Generales',
        usuario_id: 'usr_11',
        usuario_email: 'carlos.duque@scenariojobs.com',
        estado: 'ACTIVO'
    },
    {
        id: 'per_12',
        nombres: 'Camilo Andres',
        apellidos: 'Enciso Rojas',
        email_personal: 'camiloenciso1991@gmail.com',
        telefono: '3153362638',
        fecha_nacimiento: '1991-12-30',
        fecha_ingreso: '2019-04-01',
        departamento: 'Help Desk',
        puesto_id: 'pos_12',
        puesto_nombre: 'Analista Help Desk',
        usuario_id: 'usr_12',
        usuario_email: 'camilo.enciso@scenariojobs.com',
        estado: 'ACTIVO'
    },
    {
        id: 'per_13',
        nombres: 'Juan Fernando',
        apellidos: 'Erazo Ramirez',
        email_personal: 'juan.eraso@infodeclat.com',
        telefono: '3116336087',
        fecha_nacimiento: '1969-10-30',
        fecha_ingreso: '2005-01-10',
        departamento: 'Gerencia General',
        puesto_id: 'pos_13',
        puesto_nombre: 'Gerente General',
        usuario_id: 'usr_13',
        usuario_email: 'juan.erazo@scenariojobs.com',
        estado: 'ACTIVO'
    },
    {
        id: 'per_14',
        nombres: 'Jhon Jairo',
        apellidos: 'Escarraga Lasprilla',
        email_personal: 'jhonwii21@hotmail.com',
        telefono: '3137198661',
        fecha_nacimiento: '1994-08-21',
        fecha_ingreso: '2020-06-15',
        departamento: 'Mesa de Ayuda',
        puesto_id: 'pos_14',
        puesto_nombre: 'Analista Mesa de Ayuda',
        usuario_id: 'usr_14',
        usuario_email: 'jhon.escarraga@scenariojobs.com',
        estado: 'ACTIVO'
    },
    {
        id: 'per_15',
        nombres: 'Andres Leonardo',
        apellidos: 'Garcia Yara',
        email_personal: 'anleogarcia@hotmail.com',
        telefono: '3154559821',
        fecha_nacimiento: '2003-04-05',
        fecha_ingreso: '2023-08-01',
        departamento: 'Desarrollo Fullstack',
        puesto_id: 'pos_15',
        puesto_nombre: 'Desarrollador Fullstack',
        usuario_id: 'usr_15',
        usuario_email: 'andres.garcia@scenariojobs.com',
        estado: 'ACTIVO'
    },
    {
        id: 'per_16',
        nombres: 'Jorge Eduardo',
        apellidos: 'Garzon Galeano',
        email_personal: 'jorgedu0310@gmail.com',
        telefono: '3024127732',
        fecha_nacimiento: '2001-10-03',
        fecha_ingreso: '2022-05-01',
        departamento: 'AWS',
        puesto_id: 'pos_16',
        puesto_nombre: 'Ingeniero Infraestructura AWS',
        usuario_id: 'usr_16',
        usuario_email: 'jorge.garzon@scenariojobs.com',
        estado: 'ACTIVO'
    },
    {
        id: 'per_17',
        nombres: 'Jeffrey Jose',
        apellidos: 'Gazabon Acosta',
        email_personal: 'jeffrey.gazabon@gmail.com',
        telefono: '3006057368',
        fecha_nacimiento: '1995-06-24',
        fecha_ingreso: '2021-01-15',
        departamento: 'QA',
        puesto_id: 'pos_17',
        puesto_nombre: 'QA',
        usuario_id: 'usr_17',
        usuario_email: 'jeffrey.gazabon@scenariojobs.com',
        estado: 'ACTIVO'
    },
    {
        id: 'per_18',
        nombres: 'Jean Sebastian',
        apellidos: 'Giron Montes',
        email_personal: 'jgiron5639@gmail.com',
        telefono: '3002450173',
        fecha_nacimiento: '2000-07-13',
        fecha_ingreso: '2022-09-01',
        departamento: 'Mesa de Ayuda',
        puesto_id: 'pos_18',
        puesto_nombre: 'Analista Mesa de Ayuda',
        usuario_id: 'usr_18',
        usuario_email: 'jean.giron@scenariojobs.com',
        estado: 'ACTIVO'
    },
    {
        id: 'per_19',
        nombres: 'Duvan Dario',
        apellidos: 'Gongora Quiñonez',
        email_personal: 'duvangonqui14@gmail.com',
        telefono: '3172123479',
        fecha_nacimiento: '2002-09-13',
        fecha_ingreso: '2023-03-01',
        departamento: 'Mesa de Ayuda',
        puesto_id: 'pos_19',
        puesto_nombre: 'Analista Mesa de Ayuda',
        usuario_id: 'usr_19',
        usuario_email: 'duvan.gongora@scenariojobs.com',
        estado: 'ACTIVO'
    },
    {
        id: 'per_20',
        nombres: 'Juan Pablo',
        apellidos: 'Gonzalez Velasco',
        email_personal: 'juanpablogonzales2003@gmail.com',
        telefono: '3165313062',
        fecha_nacimiento: '2003-03-04',
        fecha_ingreso: '2023-07-01',
        departamento: 'Desarrollo Fullstack',
        puesto_id: 'pos_20',
        puesto_nombre: 'Desarrollador Fullstack',
        usuario_id: 'usr_20',
        usuario_email: 'juan.gonzalez@scenariojobs.com',
        estado: 'ACTIVO'
    },
    {
        id: 'per_21',
        nombres: 'Jorge Julian',
        apellidos: 'Guerra Riaño',
        email_personal: 'julian19guerra@gmail.com',
        telefono: '3163194183',
        fecha_nacimiento: '2000-02-19',
        fecha_ingreso: '2022-10-01',
        departamento: 'Mesa de Ayuda',
        puesto_id: 'pos_21',
        puesto_nombre: 'Analista Mesa de Ayuda',
        usuario_id: 'usr_21',
        usuario_email: 'jorge.guerra@scenariojobs.com',
        estado: 'ACTIVO'
    },
    {
        id: 'per_22',
        nombres: 'Rolando',
        apellidos: 'Hernandez Lopez',
        email_personal: 'r8l1s1996@hotmail.es',
        telefono: '3004036878',
        fecha_nacimiento: '1996-04-26',
        fecha_ingreso: '2019-06-01',
        departamento: 'Soporte',
        puesto_id: 'pos_22',
        puesto_nombre: 'Lider de Soporte',
        usuario_id: 'usr_22',
        usuario_email: 'rolando.hernandez@scenariojobs.com',
        estado: 'ACTIVO'
    },
    {
        id: 'per_23',
        nombres: 'Andres Felipe',
        apellidos: 'Hernandez Polindara',
        email_personal: 'felipehernandez1193@gmail.com',
        telefono: '3128592641',
        fecha_nacimiento: '2001-09-05',
        fecha_ingreso: '2022-11-01',
        departamento: 'Operaciones',
        puesto_id: 'pos_23',
        puesto_nombre: 'Analista de Operaciones',
        usuario_id: 'usr_23',
        usuario_email: 'andres.hernandez@scenariojobs.com',
        estado: 'ACTIVO'
    },
    {
        id: 'per_24',
        nombres: 'Joan Sebastian',
        apellidos: 'Hurtado Angulo',
        email_personal: 'joanhurtado134@outlook.es',
        telefono: '3176201788',
        fecha_nacimiento: '2004-12-19',
        fecha_ingreso: '2024-02-01',
        departamento: 'Ciberseguridad',
        puesto_id: 'pos_24',
        puesto_nombre: 'Analista Ciberseguridad',
        usuario_id: 'usr_24',
        usuario_email: 'joan.hurtado@scenariojobs.com',
        estado: 'ACTIVO'
    },
    {
        id: 'per_25',
        nombres: 'Johan Esti',
        apellidos: 'Hurtado Orobio',
        email_personal: 'johandev24@gmail.com',
        telefono: '3174588899',
        fecha_nacimiento: '1999-08-24',
        fecha_ingreso: '2021-10-01',
        departamento: 'Mesa de Ayuda',
        puesto_id: 'pos_25',
        puesto_nombre: 'Analista Mesa de Ayuda',
        usuario_id: 'usr_25',
        usuario_email: 'johan.hurtado@scenariojobs.com',
        estado: 'ACTIVO'
    },
    {
        id: 'per_26',
        nombres: 'Ivan Dario',
        apellidos: 'Hurtado Quintero',
        email_personal: 'dariohurtado210@gmail.com',
        telefono: '3016477242',
        fecha_nacimiento: '2001-07-21',
        fecha_ingreso: '2022-12-01',
        departamento: 'Operaciones',
        puesto_id: 'pos_26',
        puesto_nombre: 'Analista de Especialistas',
        usuario_id: 'usr_26',
        usuario_email: 'ivan.hurtado@scenariojobs.com',
        estado: 'ACTIVO'
    },
    {
        id: 'per_27',
        nombres: 'Kevin',
        apellidos: 'Landazury Guerrero',
        email_personal: 'kevinlandazuri17@gmail.com',
        telefono: '3235169634',
        fecha_nacimiento: '1999-05-01',
        fecha_ingreso: '2020-08-01',
        departamento: 'Soporte',
        puesto_id: 'pos_27',
        puesto_nombre: 'Lider de Soporte',
        usuario_id: 'usr_27',
        usuario_email: 'kevin.landazury@scenariojobs.com',
        estado: 'ACTIVO'
    },
    {
        id: 'per_28',
        nombres: 'Juan Sebastian',
        apellidos: 'Largo Muñoz',
        email_personal: 'jslargo61@gmail.com',
        telefono: '3136116812',
        fecha_nacimiento: '2000-09-01',
        fecha_ingreso: '2022-04-01',
        departamento: 'AWS',
        puesto_id: 'pos_28',
        puesto_nombre: 'Ingeniero Infraestructura AWS',
        usuario_id: 'usr_28',
        usuario_email: 'juan.largo@scenariojobs.com',
        estado: 'ACTIVO'
    },
    {
        id: 'per_29',
        nombres: 'Carlos Alberto',
        apellidos: 'Lopez Criollo',
        email_personal: 'carlos_a002@hotmail.com',
        telefono: '3147324674',
        fecha_nacimiento: '1985-05-15',
        fecha_ingreso: '2024-01-15',
        departamento: 'Desarrollo Fullstack',
        puesto_id: 'pos_29',
        puesto_nombre: 'Aprendiz SENA',
        usuario_id: 'usr_29',
        usuario_email: 'carlos.lopez@scenariojobs.com',
        estado: 'ACTIVO'
    },
    {
        id: 'per_30',
        nombres: 'Leonardo Pablo',
        apellidos: 'Lopez Zuluaga',
        email_personal: 'leonardo.lopez@aplixus.com',
        telefono: '3228932792',
        fecha_nacimiento: '1972-08-01',
        fecha_ingreso: '2008-03-01',
        departamento: 'Proyectos',
        puesto_id: 'pos_30',
        puesto_nombre: 'Director de Proyectos',
        usuario_id: 'usr_30',
        usuario_email: 'leonardo.lopez@scenariojobs.com',
        estado: 'ACTIVO'
    },
    {
        id: 'per_31',
        nombres: 'Santiago',
        apellidos: 'Lozano Osorio',
        email_personal: 'santi.23osorio@gmail.com',
        telefono: '3104164269',
        fecha_nacimiento: '1999-06-23',
        fecha_ingreso: '2021-11-01',
        departamento: 'Administración',
        puesto_id: 'pos_31',
        puesto_nombre: 'Analista Administrativo',
        usuario_id: 'usr_31',
        usuario_email: 'santiago.lozano@scenariojobs.com',
        estado: 'ACTIVO'
    },
    {
        id: 'per_32',
        nombres: 'John Fredy',
        apellidos: 'Marin Cortazar',
        email_personal: 'jhon.marin@infodeclat.com',
        telefono: '3116336082',
        fecha_nacimiento: '1980-02-28',
        fecha_ingreso: '2010-06-01',
        departamento: 'Proyectos',
        puesto_id: 'pos_32',
        puesto_nombre: 'Director de Proyectos',
        usuario_id: 'usr_32',
        usuario_email: 'john.marin@scenariojobs.com',
        estado: 'ACTIVO'
    },
    {
        id: 'per_33',
        nombres: 'Jhon Alexis',
        apellidos: 'Marin Rodriguez',
        email_personal: 'jhon.marinr2@gmail.com',
        telefono: '3102592755',
        fecha_nacimiento: '1992-12-03',
        fecha_ingreso: '2018-09-01',
        departamento: 'Operaciones',
        puesto_id: 'pos_33',
        puesto_nombre: 'Analista de Operaciones',
        usuario_id: 'usr_33',
        usuario_email: 'jhon.marin@scenariojobs.com',
        estado: 'ACTIVO'
    },
    {
        id: 'per_34',
        nombres: 'Fredy Esteban',
        apellidos: 'Mercado Gomez',
        email_personal: 'fred-esteban@outlook.com',
        telefono: '3147463093',
        fecha_nacimiento: '2000-12-13',
        fecha_ingreso: '2022-08-01',
        departamento: 'Desarrollo Fullstack',
        puesto_id: 'pos_34',
        puesto_nombre: 'Desarrollador Fullstack',
        usuario_id: 'usr_34',
        usuario_email: 'fredy.mercado@scenariojobs.com',
        estado: 'ACTIVO'
    },
    {
        id: 'per_35',
        nombres: 'Cristhian Andres',
        apellidos: 'Morales Zapata',
        email_personal: 'cristhianmorales0714@gmail.com',
        telefono: '3217497327',
        fecha_nacimiento: '2002-07-14',
        fecha_ingreso: '2023-04-01',
        departamento: 'Desarrollo Fullstack',
        puesto_id: 'pos_35',
        puesto_nombre: 'Desarrollador Fullstack',
        usuario_id: 'usr_35',
        usuario_email: 'cristhian.morales@scenariojobs.com',
        estado: 'ACTIVO'
    },
    {
        id: 'per_36',
        nombres: 'Andres Felipe',
        apellidos: 'Moreno Montoya',
        email_personal: 'andresfmontoya00@outlook.es',
        telefono: '3052781812',
        fecha_nacimiento: '2005-06-29',
        fecha_ingreso: '2024-03-01',
        departamento: 'Desarrollo Fullstack',
        puesto_id: 'pos_36',
        puesto_nombre: 'Desarrollador Fullstack',
        usuario_id: 'usr_36',
        usuario_email: 'andres.moreno@scenariojobs.com',
        estado: 'ACTIVO'
    },
    {
        id: 'per_37',
        nombres: 'Marly Yuliana',
        apellidos: 'Muñoz Pelaez',
        email_personal: 'mymp1144@gmail.com',
        telefono: '3213289456',
        fecha_nacimiento: '2000-06-24',
        fecha_ingreso: '2022-06-01',
        departamento: 'Mesa de Ayuda',
        puesto_id: 'pos_37',
        puesto_nombre: 'Analista Mesa de Ayuda',
        usuario_id: 'usr_37',
        usuario_email: 'marly.munoz@scenariojobs.com',
        estado: 'ACTIVO'
    },
    {
        id: 'per_38',
        nombres: 'Ana Cristina',
        apellidos: 'Ocaña Guerrero',
        email_personal: 'anacris78@hotmail.com',
        telefono: '3206323649',
        fecha_nacimiento: '1978-08-04',
        fecha_ingreso: '2012-01-15',
        departamento: 'Dirección Comercial',
        puesto_id: 'pos_38',
        puesto_nombre: 'Director Comercial',
        usuario_id: 'usr_38',
        usuario_email: 'ana.ocana@scenariojobs.com',
        estado: 'ACTIVO'
    },
    {
        id: 'per_39',
        nombres: 'Carolina',
        apellidos: 'Ordoñez Lopez',
        email_personal: 'carito_ol@hotmail.com',
        telefono: '3112280767',
        fecha_nacimiento: '1975-11-25',
        fecha_ingreso: '2011-02-01',
        departamento: 'Gestión Organizacional',
        puesto_id: 'pos_39',
        puesto_nombre: 'Director Gestion Organizacional',
        usuario_id: 'usr_39',
        usuario_email: 'carolina.ordonez@scenariojobs.com',
        estado: 'ACTIVO'
    },
    {
        id: 'per_40',
        nombres: 'Luz Mayerlin',
        apellidos: 'Ortiz Florez',
        email_personal: 'nemucraft@gmail.com',
        telefono: '3175232591',
        fecha_nacimiento: '2000-11-15',
        fecha_ingreso: '2021-05-01',
        departamento: 'Proyectos',
        puesto_id: 'pos_40',
        puesto_nombre: 'Director de Proyectos',
        usuario_id: 'usr_40',
        usuario_email: 'luz.ortiz@scenariojobs.com',
        estado: 'ACTIVO'
    },
    {
        id: 'per_41',
        nombres: 'Yeraldin',
        apellidos: 'Osorio Gonzalez',
        email_personal: 'yog1997@hotmail.com',
        telefono: '3126931527',
        fecha_nacimiento: '1997-06-19',
        fecha_ingreso: '2020-07-01',
        departamento: 'Contabilidad',
        puesto_id: 'pos_41',
        puesto_nombre: 'Analista Contable',
        usuario_id: 'usr_41',
        usuario_email: 'yeraldin.osorio@scenariojobs.com',
        estado: 'ACTIVO'
    },
    {
        id: 'per_42',
        nombres: 'Jasson Alexander',
        apellidos: 'Oviedo Lucano',
        email_personal: 'jassonlukno44@gmail.com',
        telefono: '3157429890',
        fecha_nacimiento: '2000-10-22',
        fecha_ingreso: '2022-03-01',
        departamento: 'Mesa de Ayuda',
        puesto_id: 'pos_42',
        puesto_nombre: 'Analista Mesa de Ayuda',
        usuario_id: 'usr_42',
        usuario_email: 'jasson.oviedo@scenariojobs.com',
        estado: 'ACTIVO'
    },
    {
        id: 'per_43',
        nombres: 'Kevin Andres',
        apellidos: 'Ramirez Guzman',
        email_personal: 'ramirez1kevin98@gmail.com',
        telefono: '3203887226',
        fecha_nacimiento: '1998-07-09',
        fecha_ingreso: '2021-02-01',
        departamento: 'Operaciones',
        puesto_id: 'pos_43',
        puesto_nombre: 'Analista de Especialistas',
        usuario_id: 'usr_43',
        usuario_email: 'kevin.ramirez@scenariojobs.com',
        estado: 'ACTIVO'
    },
    {
        id: 'per_44',
        nombres: 'Juan Angel',
        apellidos: 'Rengifo Cardenas',
        email_personal: 'juan.angel.rengifo@gmail.com',
        telefono: '3046541986',
        fecha_nacimiento: '2000-12-22',
        fecha_ingreso: '2022-01-15',
        departamento: 'Desarrollo Fullstack',
        puesto_id: 'pos_44',
        puesto_nombre: 'Desarrollador Fullstack',
        usuario_id: 'usr_44',
        usuario_email: 'juan.rengifo@scenariojobs.com',
        estado: 'ACTIVO'
    },
    {
        id: 'per_45',
        nombres: 'Jenifer Andrea',
        apellidos: 'Rivera Melecio',
        email_personal: 'jenifer1999rivera@gmail.com',
        telefono: '3146579690',
        fecha_nacimiento: '1998-04-22',
        fecha_ingreso: '2020-10-01',
        departamento: 'Desarrollo Fullstack',
        puesto_id: 'pos_45',
        puesto_nombre: 'Desarrollador Fullstack',
        usuario_id: 'usr_45',
        usuario_email: 'jenifer.rivera@scenariojobs.com',
        estado: 'ACTIVO'
    },
    {
        id: 'per_46',
        nombres: 'Diego Alejandro',
        apellidos: 'Rojas Reina',
        email_personal: 'diegoarojas@hotmail.es',
        telefono: '3165315484',
        fecha_nacimiento: '2000-09-02',
        fecha_ingreso: '2022-02-01',
        departamento: 'Desarrollo Fullstack',
        puesto_id: 'pos_46',
        puesto_nombre: 'Desarrollador Fullstack',
        usuario_id: 'usr_46',
        usuario_email: 'diego.rojas@scenariojobs.com',
        estado: 'ACTIVO'
    },
    {
        id: 'per_47',
        nombres: 'Javier Antonio',
        apellidos: 'Roncancio Cuellar',
        email_personal: 'javier.roncancio@gmail.com',
        telefono: '3165381974',
        fecha_nacimiento: '1985-09-22',
        fecha_ingreso: '2016-04-01',
        departamento: 'Análisis de Datos',
        puesto_id: 'pos_47',
        puesto_nombre: 'Analista de Datos',
        usuario_id: 'usr_47',
        usuario_email: 'javier.roncancio@scenariojobs.com',
        estado: 'ACTIVO'
    },
    {
        id: 'per_48',
        nombres: 'Luis Miguel',
        apellidos: 'Rosero Mingan',
        email_personal: 'lmiguelr10@hotmail.com',
        telefono: '3186085641',
        fecha_nacimiento: '1982-01-10',
        fecha_ingreso: '2014-06-01',
        departamento: 'Cuentas Clave',
        puesto_id: 'pos_48',
        puesto_nombre: 'Key Account Manager',
        usuario_id: 'usr_48',
        usuario_email: 'luis.rosero@scenariojobs.com',
        estado: 'ACTIVO'
    },
    {
        id: 'per_49',
        nombres: 'Anderson',
        apellidos: 'Tangarife Ortiz',
        email_personal: 'anderson50244@gmail.com',
        telefono: '3015847301',
        fecha_nacimiento: '1990-09-08',
        fecha_ingreso: '2016-08-01',
        departamento: 'Desarrollo Fullstack',
        puesto_id: 'pos_49',
        puesto_nombre: 'Lider Tecnico',
        usuario_id: 'usr_49',
        usuario_email: 'anderson.tangarife@scenariojobs.com',
        estado: 'ACTIVO'
    },
    {
        id: 'per_50',
        nombres: 'Jaider Duvan',
        apellidos: 'Valencia Segura',
        email_personal: 'jaduvase27@gmail.com',
        telefono: '3122258773',
        fecha_nacimiento: '2003-08-02',
        fecha_ingreso: '2023-05-01',
        departamento: 'Desarrollo Fullstack',
        puesto_id: 'pos_50',
        puesto_nombre: 'Lider Tecnico',
        usuario_id: 'usr_50',
        usuario_email: 'jaider.valencia@scenariojobs.com',
        estado: 'ACTIVO'
    },
    {
        id: 'per_51',
        nombres: 'Abelardo',
        apellidos: 'Vergara Sinisterra',
        email_personal: 'abelardovergarasinisterra@gmail.com',
        telefono: '3192581093',
        fecha_nacimiento: '1992-11-11',
        fecha_ingreso: '2018-07-01',
        departamento: 'Desarrollo Fullstack',
        puesto_id: 'pos_51',
        puesto_nombre: 'Desarrollador Fullstack',
        usuario_id: 'usr_51',
        usuario_email: 'abelardo.vergara@scenariojobs.com',
        estado: 'ACTIVO'
    },
    {
        id: 'per_52',
        nombres: 'Juan Esteban',
        apellidos: 'Vidal Barona',
        email_personal: 'juanestebanvidal2212@gmail.com',
        telefono: '3104243566',
        fecha_nacimiento: '2004-12-22',
        fecha_ingreso: '2024-04-01',
        departamento: 'Desarrollo Fullstack',
        puesto_id: 'pos_52',
        puesto_nombre: 'Desarrollador Fullstack',
        usuario_id: 'usr_52',
        usuario_email: 'juan.vidal@scenariojobs.com',
        estado: 'ACTIVO'
    },
    {
        id: 'per_53',
        nombres: 'Jhon Steven',
        apellidos: 'Bedoya Ramirez',
        email_personal: 'stevenbed@gmail.com',
        telefono: '3043487127',
        fecha_nacimiento: '1984-03-24',
        fecha_ingreso: '2013-09-01',
        departamento: 'Soporte',
        puesto_id: 'pos_53',
        puesto_nombre: 'Lider de Soporte',
        usuario_id: 'usr_53',
        usuario_email: 'jhon.bedoya@scenariojobs.com',
        estado: 'ACTIVO'
    },
    {
        id: 'per_54',
        nombres: 'Ana Cristina',
        apellidos: 'Aranda Castrillon',
        email_personal: 'anacrisaranda@gmail.com',
        telefono: '3188894609',
        fecha_nacimiento: '1976-09-09',
        fecha_ingreso: '2009-05-01',
        departamento: 'Soluciones',
        puesto_id: 'pos_54',
        puesto_nombre: 'Director Soluciones',
        usuario_id: 'usr_54',
        usuario_email: 'ana.aranda@scenariojobs.com',
        estado: 'ACTIVO'
    },
    {
        id: 'per_55',
        nombres: 'Camilo Andres',
        apellidos: 'Enciso Rojas',
        email_personal: 'camiloenciso1991@gmail.com',
        telefono: '3153362638',
        fecha_nacimiento: '1991-12-30',
        fecha_ingreso: '2019-04-01',
        departamento: 'Help Desk',
        puesto_id: 'pos_55',
        puesto_nombre: 'Analista Help Desk',
        usuario_id: 'usr_55',
        usuario_email: 'camilo.enciso2@scenariojobs.com',
        estado: 'ACTIVO'
    }
];

export const usePersonService = () => {
    const { fetchData, loading, error } = useFetch<FetchResponse>();
    const { openAlert } = useUIStore();
    
    const getPeople = async (params?: PersonQueryParams): Promise<FetchResponse | null> => {
        try {
            let filtered = [...MOCK_PEOPLE];

            if (params?.search) {
                const lowerSearch = params.search.toLowerCase();
                filtered = filtered.filter(p => 
                    (p.nombres + ' ' + p.apellidos).toLowerCase().includes(lowerSearch) ||
                    (p.email_personal && p.email_personal.toLowerCase().includes(lowerSearch))
                );
            }

            if (params?.departamento) {
                filtered = filtered.filter(p => p.departamento === params.departamento);
            }

            if (params?.estado) {
                filtered = filtered.filter(p => p.estado === params.estado);
            }

            // Pagination
            const page = params?.pagina || 1;
            const pageSize = params?.items_por_pagina || 10;
            const totalItems = filtered.length;
            const totalPages = Math.ceil(totalItems / pageSize);
            const startIndex = (page - 1) * pageSize;
            const endIndex = startIndex + pageSize;
            const paginatedPeople = filtered.slice(startIndex, endIndex);

            const response = (await fetchData({
                url: '/api/people',
                params: params as any,
                mockData: successMock({
                    personas: paginatedPeople,
                    paginacion: {
                        pagina_actual: page,
                        items_por_pagina: pageSize,
                        total_items: totalItems,
                        total_paginas: totalPages
                    }
                })
            })) as FetchResponse | null;

            if (response?.success === false) {
                throw new Error(response.message || 'Error al obtener personal');
            }

            return response;
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : String(error);
            openAlert(errorMessage, 'error');
            return null;
        }
    };

    const getPersonById = async (id: string): Promise<FetchResponse | null> => {
        try {
            const person = MOCK_PEOPLE.find(p => p.id === id);
            
            const mockResponse = person 
                ? successMock({ persona: person })
                : errorMock('Persona no encontrada');

            const response = (await fetchData({
                url: `/api/people/${id}`,
                mockData: mockResponse
            })) as FetchResponse | null;

            if (response?.success === false) {
                 throw new Error(response?.message || 'Error');
            }

            return response;
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : String(error);
            openAlert(errorMessage, 'error');
            return null;
        }
    };

    const createPerson = async (data: Omit<Person, 'id'>): Promise<FetchResponse | null> => {
        try {
            const newPerson: Person = {
                ...data,
                id: 'per_' + Math.random().toString(36).substr(2, 9),
                estado: 'ACTIVO' // Default
            };
            
            MOCK_PEOPLE.push(newPerson);

            return (await fetchData({
                url: '/api/people',
                method: 'POST',
                body: data as any,
                mockData: successMock({ persona: newPerson })
            })) as FetchResponse | null;
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : String(error);
            openAlert(errorMessage, 'error');
            return null;
        }
    };

    const updatePerson = async (id: string, data: Partial<Person>): Promise<FetchResponse | null> => {
        try {
            const index = MOCK_PEOPLE.findIndex(p => p.id === id);
            if (index === -1) throw new Error('Persona no encontrada');

            MOCK_PEOPLE[index] = { ...MOCK_PEOPLE[index], ...data };

            return (await fetchData({
                url: `/api/people/${id}`,
                method: 'PUT',
                body: data as any,
                mockData: successMock({ persona: MOCK_PEOPLE[index] })
            })) as FetchResponse | null;
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : String(error);
            openAlert(errorMessage, 'error');
            return null;
        }
    };

    const deletePerson = async (id: string): Promise<boolean> => {
         try {
            MOCK_PEOPLE = MOCK_PEOPLE.filter(p => p.id !== id);

             await fetchData({
                url: `/api/people/${id}`,
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

    const createUserAccount = async (personId: string, email: string, role: string): Promise<boolean> => {
        try {
            console.log(`Creating user for person ${personId} with email ${email}`);
            
             await fetchData({
                url: `/api/people/${personId}/create-user`,
                method: 'POST',
                body: { email, role },
                mockData: successMock({ success: true })
            });

            return true;
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : String(error);
            openAlert(errorMessage, 'error');
            return false;
        }
    };

    return {
        getPeople,
        getPersonById,
        createPerson,
        updatePerson,
        deletePerson,
        createUserAccount,
        loading,
        error
    };
};
