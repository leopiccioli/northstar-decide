

## Probar reminder ahora para lyotard_98@yahoo.com

### Situación actual

- Record: `d20633cf` (creado hoy, "Situación actual", periodo 1m)
- Reminder pendiente: `bd094c8c`, attempt #1, programado para **10 de marzo 2026**
- Estado: `pending`

### Pasos

1. **Adelantar el scheduled_for** del reminder `bd094c8c` a `now()` con un UPDATE directo en la tabla `outbound_emails`
2. **Ejecutar `send-reminders`** via HTTP para que procese el reminder
3. **Verificar** que el email llega a lyotard_98@yahoo.com con el link conteniendo `utm_content=reminder_1`

### Detalle tecnico

```sql
UPDATE outbound_emails 
SET scheduled_for = now() 
WHERE id = 'bd094c8c-ea00-4e3d-8100-44a6c50852c5';
```

Luego invocar la edge function `send-reminders` con un POST. La funcion va a:
- Encontrar el reminder con `scheduled_for <= now()`
- Buscar el record original para armar el contenido
- Verificar que no haya medicion mas nueva (no la hay, es la ultima)
- Enviar el email via Resend con `utm_content=reminder_1` en el link
- Programar el follow-up #2 para 30 dias despues

### Que verificar en el email recibido

- El link contiene `utm_content=reminder_1`
- Los valores de Dinero/Desarrollo/Diversion coinciden con el record
- El periodo dice "Hace 1 mes" (o similar)

