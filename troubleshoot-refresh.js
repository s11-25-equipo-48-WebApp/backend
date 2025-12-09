#!/usr/bin/env node

/**
 * Troubleshooting Script - Refresh Token
 * 
 * Este script ayuda a diagnosticar problemas comunes con el refresh token
 */

const readline = require('readline');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

console.log('🔧 Asistente de Troubleshooting - Refresh Token\n');
console.log('Este script te ayudará a diagnosticar problemas comunes.\n');

const questions = [
  {
    id: 'login',
    question: '¿El login funciona correctamente? (s/n): ',
    yes: 'login_ok',
    no: 'login_fail'
  },
  {
    id: 'login_ok',
    question: '¿Se establece la cookie "refresh-token" después del login? (s/n): ',
    yes: 'cookie_ok',
    no: 'cookie_fail'
  },
  {
    id: 'cookie_ok',
    question: '¿La cookie es httpOnly? (Verifica en DevTools) (s/n): ',
    yes: 'httponly_ok',
    no: 'httponly_fail'
  },
  {
    id: 'httponly_ok',
    question: '¿El endpoint /auth/refresh responde? (s/n): ',
    yes: 'endpoint_ok',
    no: 'endpoint_fail'
  },
  {
    id: 'endpoint_ok',
    question: '¿El refresh retorna un nuevo accessToken? (s/n): ',
    yes: 'success',
    no: 'no_token'
  }
];

const solutions = {
  login_fail: {
    title: '❌ Problema: Login no funciona',
    steps: [
      '1. Verifica las credenciales',
      '2. Revisa los logs del backend',
      '3. Verifica que la base de datos esté accesible',
      '4. Asegúrate de que el usuario exista'
    ]
  },
  cookie_fail: {
    title: '❌ Problema: Cookie no se establece',
    steps: [
      '1. Verifica que RefreshTokenInterceptor esté registrado en auth.controller.ts',
      '2. Verifica los logs: debe aparecer "[REFRESH TOKEN INTERCEPTOR] Estableciendo cookie"',
      '3. Verifica que el login retorne refreshToken en el body (antes del interceptor)',
      '4. En DevTools → Network → Response Headers, busca "Set-Cookie"',
      '5. Verifica CORS: credentials debe ser true'
    ]
  },
  httponly_fail: {
    title: '⚠️  Problema: Cookie no es httpOnly',
    steps: [
      '1. Verifica refresh-token.interceptor.ts',
      '2. Debe tener: httpOnly: true en las opciones de la cookie',
      '3. Reinicia el servidor después de cualquier cambio'
    ]
  },
  endpoint_fail: {
    title: '❌ Problema: Endpoint /auth/refresh no responde',
    steps: [
      '1. Verifica que JwtRefreshGuard esté registrado en el endpoint',
      '2. Verifica que la cookie se esté enviando en la request',
      '3. En Postman/Insomnia, asegúrate de incluir la cookie manualmente',
      '4. Verifica los logs: "[JWT REFRESH STRATEGY] Validando refresh token"',
      '5. Si dice "Cookies disponibles: []", la cookie no está llegando',
      '   → Verifica withCredentials: true en el frontend',
      '   → Verifica CORS en el backend (credentials: true)',
      '6. Si dice "Token no encontrado en DB", el tokenId no está en el payload',
      '   → Verifica que auth.service.ts incluya tokenId en refreshPayload',
      '   → Haz logout y login nuevamente (tokens viejos son incompatibles)'
    ]
  },
  no_token: {
    title: '❌ Problema: Refresh no retorna accessToken',
    steps: [
      '1. Verifica los logs del backend',
      '2. Busca errores en AuthService.refresh()',
      '3. Verifica que el usuario exista en la base de datos',
      '4. Verifica que las organizaciones del usuario estén cargadas',
      '5. Verifica JWT_SECRET en .env'
    ]
  },
  success: {
    title: '✅ ¡Genial! El flujo básico funciona',
    steps: [
      'Ahora verifica:',
      '1. El refresh automático del frontend funciona cuando el token expira',
      '2. Las requests se reintentan correctamente',
      '3. El usuario no nota ninguna interrupción',
      '',
      'Si algo de esto falla:',
      '→ Verifica services/config.ts en el frontend',
      '→ Verifica que el interceptor de axios esté configurado',
      '→ Verifica withCredentials: true en las requests'
    ]
  }
};

let currentQuestion = questions[0];
const answers = {};

function ask() {
  if (!currentQuestion) {
    rl.close();
    return;
  }

  rl.question(currentQuestion.question, (answer) => {
    const cleanAnswer = answer.trim().toLowerCase();
    answers[currentQuestion.id] = cleanAnswer;

    if (cleanAnswer === 's' || cleanAnswer === 'si' || cleanAnswer === 'y' || cleanAnswer === 'yes') {
      if (currentQuestion.yes) {
        if (solutions[currentQuestion.yes]) {
          showSolution(currentQuestion.yes);
          rl.close();
          return;
        }
        currentQuestion = questions.find(q => q.id === currentQuestion.yes);
      }
    } else if (cleanAnswer === 'n' || cleanAnswer === 'no') {
      if (currentQuestion.no) {
        showSolution(currentQuestion.no);
        rl.close();
        return;
      }
    } else {
      console.log('⚠️  Por favor responde s/n');
    }

    ask();
  });
}

function showSolution(solutionId) {
  const solution = solutions[solutionId];
  if (!solution) {
    console.log('🤷 No se encontró solución específica.');
    rl.close();
    return;
  }

  console.log('\n' + '='.repeat(60));
  console.log(solution.title);
  console.log('='.repeat(60));
  console.log('');
  solution.steps.forEach(step => console.log(step));
  console.log('\n📚 Para más información, consulta:');
  console.log('   - TEST_REFRESH_TOKEN.md (guía de pruebas)');
  console.log('   - REFRESH_TOKEN_FIX.md (resumen de cambios)');
  console.log('   - Artifact "Corrección del Refresh Token" (documentación completa)');
  console.log('');
}

// Iniciar el asistente
ask();

rl.on('close', () => {
  console.log('\n👋 ¡Hasta luego! Si necesitas más ayuda, consulta la documentación.\n');
  process.exit(0);
});
