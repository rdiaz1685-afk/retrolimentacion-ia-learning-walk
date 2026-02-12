
export const CAMPUS_DATA = {
    "Norte": {
        "sheet_id": "1URIQvIBfw7ydn5-K9LizTgG_GecadfaVJRZKeA6YDDA",
        "emails_coordinadores": [
            "ivonne.gongora@cambridgemty.edu.mx",
            "camelgarejo@cambridgemty.edu.mx",
            "carmen.trevino@cambridgemty.edu.mx",
            "epalomares@cambridgemty.edu.mx",
            "jessica.hurtado@cambridgemty.edu.mx",
            "ivon.estrada@cambridgemty.edu.mx",
            "veronica.moreno@cambridgemty.edu.mx"
        ],
        "emails_directora": [
            "rgarcia@cambridgemty.edu.mx"
        ]
    },
    "Anahuac": {
        "sheet_id": "1vu6AX0zBNiGO-CcjXMl1CvZh7aXBuzLd_7wdhPb27lc",
        "emails_coordinadores": [
            "ariadna.cortina@cambridgemty.edu.mx",
            "belinda.cerda@cambridgemty.edu.mx",
            "camilo.sanchez@cambridgemty.edu.mx"
        ],
        "emails_directora": [
            "ariadna.cortina@cambridgemty.edu.mx"
        ]
    },
    "Mitras": {
        "sheet_id": "1G2snA46xg8FuCw4iwUAFh7NizoT8_Nt4qv2wfwgWxw0",
        "emails_coordinadores": [
            "anakaren.delagarza@cambridgemty.edu.mx",
            "stephanie.salazar@cambridgemty.edu.mx",
            "pluna@cambridgemty.edu.mx"
        ],
        "emails_directora": [
            "emma.herrera@cambridgemty.edu.mx",
            "rafael.diaz@cambridgemty.edu.mx"
        ]
    },
    "Cumbres": {
        "sheet_id": "1WbFN132KVka3ppoXYW0x_H-vSpvCu1rclta_yhHP4aA",
        "emails_coordinadores": [
            "evers.grimaldo@cambridgemty.edu.mx",
            "brenda.chavez@cambridgemty.edu.mx",
            "cesar.castillo@cambridgemty.edu.mx",
            "ericka.delgado@cambridgemty.edu.mx",
            "javier.martinez@cambridgemty.edu.mx",
            "melissa.morga@cambridgemty.edu.mx",
            "monica.ramirez@cambridgemty.edu.mx",
            "oscperez@cambridgemty.edu.mx"
        ],
        "emails_directora": [
            "elizabeth.garcia@cambridgemty.edu.mx"
        ]
    },
    "Dominio": {
        "sheet_id": "1-xOeUbTjVmeEusF9IaoETcUH2Irjd1i1hbr62al3-S8",
        "emails_coordinadores": [
            "kvazquez@cambridgemty.edu.mx",
            "oscar.nandayapa@cambridgemty.edu.mx",
            "rosa.alvarez@cambridgemty.edu.mx",
            "separtida@cambridgemty.edu.mx",
            "anaselene.rodriguez@cambridgemty.edu.mx",
            "ludivina.solis@cambridgemty.edu.mx",
            "stephanie.carrillo@cambridgemty.edu.mx"
        ],
        "emails_directora": [
            "evers.grimaldo@cambridgemty.edu.mx"
        ]
    }
};

export const RECTORIA_EMAILS = [
    "ernesto.matias@cambridgemty.edu.mx",
    "lramos@cambridgemty.edu.mx"
];

export const SIMULATION_CONFIG: Record<string, { role: string; campus: string; mockEmail?: string }> = {
    "lramos@cambridgemty.edu.mx": {
        role: "COORDINADORA",
        campus: "Mitras",
        mockEmail: "anakaren.delagarza@cambridgemty.edu.mx"
    },
    "ernesto.matias@cambridgemty.edu.mx": {
        role: "COORDINADORA",
        campus: "Mitras",
        mockEmail: "anakaren.delagarza@cambridgemty.edu.mx"
    },
    "rafael.diaz@cambridgemty.edu.mx": {
        role: "COORDINADORA",
        campus: "Mitras",
        mockEmail: "anakaren.delagarza@cambridgemty.edu.mx"
    }
};

export const SHEET_NAME = "evaluaciones";
