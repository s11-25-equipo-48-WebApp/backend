#!/usr/bin/env node

/**
 * Script de Verificación - Refresh Token
 * 
 * Este script verifica que todas las configuraciones necesarias
 * para el refresh token estén correctamente implementadas.
 */

const fs = require('fs');
const path = require('path');

console.log('🔍 Verificando configuración de Refresh Token...\n');

const checks = {
  passed: [],
  failed: [],
};

// ========================================
// 1. Verificar .env
// ========================================
console.log('📄 Verificando .env...');
try {
  const envPath = path.join(__dirname, '.env');
  const envContent = fs.readFileSync(envPath, 'utf8');
  
  const jwtSecret = envContent.match(/JWT_SECRET=(.+)/)?.[1];
  const jwtRefreshSecret = envContent.match(/JWT_REFRESH_SECRET=(.+)/)?.[1];
  
  if (!jwtSecret) {
    checks.failed.push('❌ JWT_SECRET no encontrado en .env');
  } else if (jwtSecret.trim() === 'mi_secreto_jwt') {
    checks.failed.push('⚠️  JWT_SECRET todavía tiene el valor por defecto - considera cambiarlo');
  } else {
    checks.passed.push('✅ JWT_SECRET configurado');
  }
  
  if (!jwtRefreshSecret) {
    checks.failed.push('❌ JWT_REFRESH_SECRET no encontrado en .env');
  } else if (jwtRefreshSecret.trim() === 'mi_secreto_jwt') {
    checks.failed.push('❌ JWT_REFRESH_SECRET tiene el mismo valor que antes - DEBE SER DIFERENTE');
  } else if (jwtSecret && jwtRefreshSecret && jwtSecret.trim() === jwtRefreshSecret.trim()) {
    checks.failed.push('❌ JWT_SECRET y JWT_REFRESH_SECRET son iguales - DEBEN SER DIFERENTES');
  } else {
    checks.passed.push('✅ JWT_REFRESH_SECRET configurado y es diferente de JWT_SECRET');
  }
} catch (error) {
  checks.failed.push(`❌ Error leyendo .env: ${error.message}`);
}

// ========================================
// 2. Verificar auth.service.ts
// ========================================
console.log('\n📄 Verificando auth.service.ts...');
try {
  const servicePath = path.join(__dirname, 'src', 'modules', 'auth', 'auth.service.ts');
  const serviceContent = fs.readFileSync(servicePath, 'utf8');
  
  if (serviceContent.includes('tokenId: newTokenEntity.id')) {
    checks.passed.push('✅ auth.service.ts incluye tokenId en el refresh payload');
  } else {
    checks.failed.push('❌ auth.service.ts NO incluye tokenId en el refresh payload');
  }
  
  if (serviceContent.includes('refreshPayload')) {
    checks.passed.push('✅ auth.service.ts usa refreshPayload separado');
  } else {
    checks.failed.push('❌ auth.service.ts NO usa refreshPayload separado');
  }
} catch (error) {
  checks.failed.push(`❌ Error leyendo auth.service.ts: ${error.message}`);
}

// ========================================
// 3. Verificar JwtRefreshStrategy.ts
// ========================================
console.log('\n📄 Verificando JwtRefreshStrategy.ts...');
try {
  const strategyPath = path.join(__dirname, 'src', 'jwt', 'JwtRefreshStrategy.ts');
  const strategyContent = fs.readFileSync(strategyPath, 'utf8');
  
  if (strategyContent.includes('payload.tokenId')) {
    checks.passed.push('✅ JwtRefreshStrategy verifica payload.tokenId');
  } else {
    checks.failed.push('❌ JwtRefreshStrategy NO verifica payload.tokenId');
  }
  
  if (strategyContent.includes('this.logger.log')) {
    checks.passed.push('✅ JwtRefreshStrategy tiene logs de debugging');
  } else {
    checks.failed.push('⚠️  JwtRefreshStrategy no tiene logs (recomendado para debugging)');
  }
} catch (error) {
  checks.failed.push(`❌ Error leyendo JwtRefreshStrategy.ts: ${error.message}`);
}

// ========================================
// 4. Verificar refresh-token.interceptor.ts
// ========================================
console.log('\n📄 Verificando refresh-token.interceptor.ts...');
try {
  const interceptorPath = path.join(__dirname, 'src', 'common', 'interceptors', 'refresh-token.interceptor.ts');
  const interceptorContent = fs.readFileSync(interceptorPath, 'utf8');
  
  if (interceptorContent.includes('httpOnly: true')) {
    checks.passed.push('✅ RefreshTokenInterceptor establece httpOnly: true');
  } else {
    checks.failed.push('❌ RefreshTokenInterceptor NO establece httpOnly: true');
  }
  
  if (interceptorContent.includes('this.logger.log')) {
    checks.passed.push('✅ RefreshTokenInterceptor tiene logs de debugging');
  } else {
    checks.failed.push('⚠️  RefreshTokenInterceptor no tiene logs (recomendado para debugging)');
  }
} catch (error) {
  checks.failed.push(`❌ Error leyendo refresh-token.interceptor.ts: ${error.message}`);
}

// ========================================
// 5. Verificar auth.controller.ts
// ========================================
console.log('\n📄 Verificando auth.controller.ts...');
try {
  const controllerPath = path.join(__dirname, 'src', 'modules', 'auth', 'auth.controller.ts');
  const controllerContent = fs.readFileSync(controllerPath, 'utf8');
  
  if (controllerContent.includes('@UseGuards(JwtRefreshGuard)')) {
    checks.passed.push('✅ auth.controller.ts usa JwtRefreshGuard en /refresh');
  } else {
    checks.failed.push('❌ auth.controller.ts NO usa JwtRefreshGuard en /refresh');
  }
  
  if (controllerContent.includes('@UseInterceptors(RefreshTokenInterceptor)')) {
    checks.passed.push('✅ auth.controller.ts usa RefreshTokenInterceptor en /refresh');
  } else {
    checks.failed.push('❌ auth.controller.ts NO usa RefreshTokenInterceptor en /refresh');
  }
} catch (error) {
  checks.failed.push(`❌ Error leyendo auth.controller.ts: ${error.message}`);
}

// ========================================
// 6. Verificar main.ts
// ========================================
console.log('\n📄 Verificando main.ts...');
try {
  const mainPath = path.join(__dirname, 'src', 'main.ts');
  const mainContent = fs.readFileSync(mainPath, 'utf8');
  
  if (mainContent.includes('cookieParser')) {
    checks.passed.push('✅ main.ts usa cookie-parser');
  } else {
    checks.failed.push('❌ main.ts NO usa cookie-parser');
  }
  
  if (mainContent.includes('credentials: true')) {
    checks.passed.push('✅ CORS configurado con credentials: true');
  } else {
    checks.failed.push('❌ CORS NO está configurado con credentials: true');
  }
} catch (error) {
  checks.failed.push(`❌ Error leyendo main.ts: ${error.message}`);
}

// ========================================
// Resumen
// ========================================
console.log('\n' + '='.repeat(60));
console.log('📊 RESUMEN DE VERIFICACIÓN');
console.log('='.repeat(60));

console.log(`\n✅ Verificaciones exitosas: ${checks.passed.length}`);
checks.passed.forEach(check => console.log(`   ${check}`));

if (checks.failed.length > 0) {
  console.log(`\n❌ Verificaciones fallidas: ${checks.failed.length}`);
  checks.failed.forEach(check => console.log(`   ${check}`));
  console.log('\n⚠️  Por favor, revisa los errores antes de continuar.\n');
  process.exit(1);
} else {
  console.log('\n🎉 ¡Todas las verificaciones pasaron exitosamente!');
  console.log('✨ Tu configuración de refresh token está lista.\n');
  console.log('Próximos pasos:');
  console.log('1. Reinicia el servidor: npm run start:dev');
  console.log('2. Prueba el login desde el frontend');
  console.log('3. Verifica los logs para confirmar el flujo');
  console.log('4. Lee TEST_REFRESH_TOKEN.md para instrucciones de prueba\n');
  process.exit(0);
}
