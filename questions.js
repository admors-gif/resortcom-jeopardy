// ============================================================
// RESORTCOM GDL - TRIVIA MUNDIAL - PREGUNTAS HÍBRIDAS
// 100 pts = Fácil (todos saben)
// 200 pts = Fácil-Medio (cultura pop / lógica)
// 300 pts = Medio (algo de conocimiento)
// 400 pts = Difícil (específica pero interesante)
// 500 pts = Muy difícil (solo si sabes del tema)
// ============================================================

const QUESTIONS_DB = {

    // ===========================
    // 🇲🇽 MÉXICO
    // ===========================
    mx: {
        name: "MÉXICO",
        flagImg: "https://flagcdn.com/w80/mx.png",
        questions: [
            {
                q: "¿Cuál es la comida más representativa de México en todo el mundo?",
                options: ["Sushi", "Tacos", "Pizza", "Hamburguesa"],
                answer: 1
            },
            {
                q: "¿Qué se celebra en México el 2 de noviembre?",
                options: ["Independencia", "Navidad", "Día de Muertos", "Cinco de Mayo"],
                answer: 2
            },
            {
                q: "¿Cuál es la moneda oficial de México?",
                options: ["Dólar", "Euro", "Peso mexicano", "Bolívar"],
                answer: 2
            },
            {
                q: "¿Qué civilización antigua construyó la pirámide de Chichén Itzá?",
                options: ["Azteca", "Inca", "Maya", "Olmeca"],
                answer: 2
            },
            {
                q: "¿En qué año México fue sede de la Copa del Mundo por primera vez?",
                options: ["1986", "1970", "1978", "1966"],
                answer: 1
            }
        ]
    },

    // ===========================
    // 🇦🇺 AUSTRALIA
    // ===========================
    au: {
        name: "AUSTRALIA",
        flagImg: "https://flagcdn.com/w80/au.png",
        questions: [
            {
                q: "¿Qué animal es el más famoso y representativo de Australia?",
                options: ["Oso polar", "Canguro", "León", "Elefante"],
                answer: 1
            },
            {
                q: "¿Cuál es la ciudad más grande de Australia?",
                options: ["Melbourne", "Brisbane", "Sídney", "Perth"],
                answer: 2
            },
            {
                q: "¿Cómo se llama la famosa estructura rocosa roja en el centro de Australia?",
                options: ["Monte Fuji", "Uluru (Ayers Rock)", "Gran Cañón", "Table Mountain"],
                answer: 1
            },
            {
                q: "¿Qué barrera de coral en Australia es la más grande del mundo?",
                options: ["Barrera de Belice", "Gran Barrera de Coral", "Arrecife de Apo", "Barrera de Ningaloo"],
                answer: 1
            },
            {
                q: "¿En qué año fueron los Juegos Olímpicos de Sídney?",
                options: ["1996", "2004", "2000", "2008"],
                answer: 2
            }
        ]
    },

    // ===========================
    // 🇨🇷 COSTA RICA
    // ===========================
    cr: {
        name: "COSTA RICA",
        flagImg: "https://flagcdn.com/w80/cr.png",
        questions: [
            {
                q: "¿En qué continente se encuentra Costa Rica?",
                options: ["Europa", "Asia", "América", "África"],
                answer: 2
            },
            {
                q: "¿Cuál es la frase típica que los costarricenses usan para decir que todo está bien?",
                options: ["¡Órale!", "¡Pura Vida!", "¡Chevere!", "¡Bacano!"],
                answer: 1
            },
            {
                q: "¿Cuál es la moneda oficial de Costa Rica?",
                options: ["Peso", "Colón", "Lempira", "Quetzal"],
                answer: 1
            },
            {
                q: "Costa Rica es famosa por no tener algo que la mayoría de países tienen. ¿Qué es?",
                options: ["Presidente", "Aeropuertos", "Ejército", "Universidades"],
                answer: 2
            },
            {
                q: "¿Qué porcentaje de la biodiversidad mundial se encuentra en Costa Rica aproximadamente?",
                options: ["1%", "6%", "15%", "25%"],
                answer: 1
            }
        ]
    },

    // ===========================
    // 🇫🇷 FRANCIA
    // ===========================
    fr: {
        name: "FRANCIA",
        flagImg: "https://flagcdn.com/w80/fr.png",
        questions: [
            {
                q: "¿Cuál es el monumento más famoso de París?",
                options: ["Big Ben", "Torre Eiffel", "Coliseo", "Estatua de la Libertad"],
                answer: 1
            },
            {
                q: "¿Qué tipo de comida es el croissant?",
                options: ["Pasta", "Pan/bollería", "Postre frío", "Sopa"],
                answer: 1
            },
            {
                q: "¿Cómo se llama el famoso museo de arte en París donde está la Mona Lisa?",
                options: ["Museo del Prado", "Museo Louvre", "British Museum", "MoMA"],
                answer: 1
            },
            {
                q: "¿Cuántas veces ha ganado Francia la Copa del Mundo de fútbol?",
                options: ["1", "3", "2", "4"],
                answer: 2
            },
            {
                q: "¿En qué año se completó la construcción de la Torre Eiffel?",
                options: ["1889", "1901", "1875", "1920"],
                answer: 0
            }
        ]
    },

    // ===========================
    // 🇹🇭 TAILANDIA
    // ===========================
    th: {
        name: "TAILANDIA",
        flagImg: "https://flagcdn.com/w80/th.png",
        questions: [
            {
                q: "¿Con qué otro nombre se conoce a Tailandia?",
                options: ["País de la sonrisa", "País del sol", "País de las islas", "País del arroz"],
                answer: 0
            },
            {
                q: "¿Cuál es la capital de Tailandia?",
                options: ["Tokio", "Bangkok", "Hanoi", "Yakarta"],
                answer: 1
            },
            {
                q: "¿Qué platillo tailandés famoso lleva leche de coco, pollo y curry?",
                options: ["Sushi", "Pad Thai", "Tom Kha Gai", "Pho"],
                answer: 2
            },
            {
                q: "¿Qué arte marcial es originaria de Tailandia?",
                options: ["Karate", "Taekwondo", "Jiu-Jitsu", "Muay Thai"],
                answer: 3
            },
            {
                q: "¿Cuál es el nombre completo ceremonial de Bangkok, considerado el más largo del mundo?",
                options: [
                    "Krung Thep Mahanakhon... (168 letras)",
                    "Bangmakok Suvarnabhumi",
                    "Thai Bangkok Ratcha",
                    "Siam Phraya Nakhon"
                ],
                answer: 0
            }
        ]
    },

    // ===========================
    // 🇳🇿 NUEVA ZELANDA
    // ===========================
    nz: {
        name: "NUEVA ZELANDA",
        flagImg: "https://flagcdn.com/w80/nz.png",
        questions: [
            {
                q: "¿Qué famosa trilogía de películas fue filmada en Nueva Zelanda?",
                options: ["Harry Potter", "Star Wars", "El Señor de los Anillos", "Matrix"],
                answer: 2
            },
            {
                q: "¿Cómo se le llama popularmente a los habitantes de Nueva Zelanda?",
                options: ["Aussies", "Kiwis", "Kookaburras", "Hobbits"],
                answer: 1
            },
            {
                q: "¿Qué pueblo indígena es originario de Nueva Zelanda?",
                options: ["Aborígenes", "Incas", "Maoríes", "Samoanos"],
                answer: 2
            },
            {
                q: "¿Cuál es la famosa danza guerrera que realiza el equipo de rugby de Nueva Zelanda?",
                options: ["Samba", "Haka", "Capoeira", "Flamenco"],
                answer: 1
            },
            {
                q: "¿Cuántas islas principales componen Nueva Zelanda?",
                options: ["1", "2", "3", "5"],
                answer: 1
            }
        ]
    },

    // ===========================
    // 🇯🇵 JAPÓN
    // ===========================
    jp: {
        name: "JAPÓN",
        flagImg: "https://flagcdn.com/w80/jp.png",
        questions: [
            {
                q: "¿Cuál de estos platillos es originario de Japón?",
                options: ["Tacos", "Pizza", "Sushi", "Kebab"],
                answer: 2
            },
            {
                q: "¿Cómo se llama la montaña más famosa de Japón?",
                options: ["Monte Everest", "Monte Fuji", "Monte Kilimanjaro", "Monte Blanc"],
                answer: 1
            },
            {
                q: "¿Qué significa la palabra 'Karaoke' en japonés?",
                options: ["Cantar fuerte", "Orquesta vacía", "Música feliz", "Voz bonita"],
                answer: 1
            },
            {
                q: "¿Cuál es la flor nacional de Japón?",
                options: ["Rosa", "Loto", "Crisantemo", "Cerezo (Sakura)"],
                answer: 2
            },
            {
                q: "¿En qué ciudad japonesa se celebraron los Juegos Olímpicos de verano 2021 (pospuestos del 2020)?",
                options: ["Osaka", "Kioto", "Tokio", "Nagoya"],
                answer: 2
            }
        ]
    },

    // ===========================
    // 🇨🇦 CANADÁ
    // ===========================
    ca: {
        name: "CANADÁ",
        flagImg: "https://flagcdn.com/w80/ca.png",
        questions: [
            {
                q: "¿Qué hoja aparece en la bandera de Canadá?",
                options: ["Hoja de roble", "Hoja de maple (arce)", "Hoja de palma", "Hoja de olivo"],
                answer: 1
            },
            {
                q: "¿Cuáles son los dos idiomas oficiales de Canadá?",
                options: ["Inglés y español", "Inglés y francés", "Francés y alemán", "Inglés y portugués"],
                answer: 1
            },
            {
                q: "¿Cuál es el deporte nacional de invierno de Canadá?",
                options: ["Fútbol", "Béisbol", "Hockey sobre hielo", "Esquí"],
                answer: 2
            },
            {
                q: "¿Qué famosas cataratas comparte Canadá con Estados Unidos?",
                options: ["Cataratas del Iguazú", "Cataratas Victoria", "Cataratas del Niágara", "Cataratas del Ángel"],
                answer: 2
            },
            {
                q: "¿Canadá es el país más grande del mundo en superficie después de cuál país?",
                options: ["Estados Unidos", "China", "Rusia", "Brasil"],
                answer: 2
            }
        ]
    },

    // ===========================
    // 🇧🇷 BRASIL
    // ===========================
    br: {
        name: "BRASIL",
        flagImg: "https://flagcdn.com/w80/br.png",
        questions: [
            {
                q: "¿Cuál es el deporte más popular de Brasil?",
                options: ["Béisbol", "Cricket", "Fútbol", "Tenis"],
                answer: 2
            },
            {
                q: "¿En qué ciudad de Brasil se celebra el carnaval más famoso del mundo?",
                options: ["São Paulo", "Salvador de Bahía", "Río de Janeiro", "Brasilia"],
                answer: 2
            },
            {
                q: "¿Qué idioma se habla oficialmente en Brasil?",
                options: ["Español", "Portugués", "Inglés", "Francés"],
                answer: 1
            },
            {
                q: "¿Cómo se llama la famosa estatua gigante de Jesús en Río de Janeiro?",
                options: ["Cristo Rey", "Cristo Redentor", "Cristo Salvador", "Cristo de los Andes"],
                answer: 1
            },
            {
                q: "¿Cuántas Copas del Mundo de fútbol ha ganado Brasil?",
                options: ["3", "4", "5", "6"],
                answer: 2
            }
        ]
    },

    // ===========================
    // 🇲🇦 MARRUECOS
    // ===========================
    ma: {
        name: "MARRUECOS",
        flagImg: "https://flagcdn.com/w80/ma.png",
        questions: [
            {
                q: "¿En qué continente se encuentra Marruecos?",
                options: ["Europa", "Asia", "América", "África"],
                answer: 3
            },
            {
                q: "¿Qué famoso desierto se extiende por el sur de Marruecos?",
                options: ["Gobi", "Atacama", "Sahara", "Kalahari"],
                answer: 2
            },
            {
                q: "¿Cuál es la bebida tradicional que los marroquíes ofrecen como señal de hospitalidad?",
                options: ["Café", "Té de menta", "Jugo de naranja", "Leche de almendra"],
                answer: 1
            },
            {
                q: "¿Hasta qué etapa llegó Marruecos en el Mundial de Qatar 2022, siendo el primer país africano en lograrlo?",
                options: ["Cuartos de final", "Semifinales", "Final", "Octavos de final"],
                answer: 1
            },
            {
                q: "¿Cuál es la ciudad de Marruecos conocida como la 'Ciudad Azul'?",
                options: ["Marrakech", "Fez", "Chefchaouen", "Casablanca"],
                answer: 2
            }
        ]
    }
};
