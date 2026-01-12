# 🗳️ Voto Informado CR 2026

CLI para investigar a los candidatos presidenciales de Costa Rica 2026.

## Instalación

```bash
git clone https://github.com/brolag/voto-informado-cr-2026.git
cd voto-informado-cr-2026
npm install
npm link  # Para usar 'voto' globalmente
```

## Uso

```bash
# ⭐ Descubrí tu candidato ideal con un quiz
voto quiz

# 🤖 Asistente IA para preguntas sobre candidatos
voto config                      # Configurar LLM (primera vez)
voto chat                        # Chat interactivo con IA
voto ask "¿qué propone PLN?"     # Pregunta rápida

# Ver todos los candidatos
voto candidatos

# Ver perfil de un candidato (usa siglas)
voto perfil PLN

# Comparar dos candidatos
voto comparar PLN PUSC

# Buscar un tema en todas las entrevistas
voto buscar educación

# Ver temas más discutidos
voto temas

# Modo interactivo guiado
voto explorar
```

## Asistente IA

El asistente usa un LLM para responder preguntas sobre los candidatos basándose en las transcripciones de entrevistas.

### Configuración

```bash
voto config
```

Te permite elegir entre:
- **Ollama (Local)** - Gratis, privado, corre en tu máquina
- **OpenAI** - GPT-4o, rápido y preciso
- **Claude (Anthropic)** - Claude 3.5, excelente razonamiento
- **Google Gemini** - Free tier generoso

### Uso del Chat

```bash
# Chat interactivo
voto chat

# Pregunta rápida
voto ask "¿Qué propone Claudia Dobles sobre educación?"
voto ask "Compará a Álvaro Ramos y Juan Carlos Hidalgo"
voto ask "¿Quién habla más de seguridad?"
```

## Quiz de Afinidad Política

El comando `voto quiz` te hace preguntas sobre:
- Tus prioridades (economía, salud, educación, seguridad, ambiente)
- Tu enfoque económico preferido
- Tu posición sobre la CCSS
- Cómo combatir la inseguridad
- Balance entre ambiente y desarrollo
- Políticas de género
- Experiencia vs caras nuevas

Al final te recomienda un **Top 3 de candidatos** más alineados con tus valores, con explicaciones de por qué cada uno podría ser buena opción para vos.

## Datos Incluidos

| Tipo | Cantidad | Descripción |
|------|----------|-------------|
| Candidatos | 20 | Todos los inscritos ante el TSE |
| Entrevistas TSE | 20 | Una por candidato |
| Debates | 3 | Debates oficiales del TSE |
| Entrevistas adicionales | 15 | No Pasa Nada, Sepamos Ser Libres, En Profundidad |
| Planes de Gobierno | 20 | PDFs oficiales |

## Siglas de Partidos Principales

- **PLN** - Liberación Nacional (Álvaro Ramos)
- **PUSC** - Unidad Social Cristiana (Juan Carlos Hidalgo)
- **CAC** - Coalición Acción Ciudadana (Claudia Dobles)
- **FA** - Frente Amplio (Ariel Robles)
- **PLP** - Liberal Progresista (Eliécer Feinzaig)
- **PNR** - Nueva República (Fabricio Alvarado)
- **UP** - Unidos Podemos (Natalia Díaz)
- **PPSO** - Pueblo Soberano (Laura Fernández)

## Para Desarrolladores

```bash
# Reprocesar transcripciones
npm run process

# Reconstruir knowledge base
npm run build-kb

# Crear binarios standalone
npm run build
```

## Licencia

MIT - Hecho para informar el voto responsable.

---

*Tu voto cuenta. Informáte antes de votar.* 🇨🇷
