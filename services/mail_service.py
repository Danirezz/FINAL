from fastapi_mail import FastMail, MessageSchema, ConnectionConfig, MessageType
from config import (
    MAIL_USERNAME, MAIL_PASSWORD, MAIL_FROM,
    MAIL_FROM_NAME, MAIL_SERVER, MAIL_PORT,
    MAIL_SSL_TLS, MAIL_STARTTLS, APP_URL
)

_conf = ConnectionConfig(
    MAIL_USERNAME   = MAIL_USERNAME,
    MAIL_PASSWORD   = MAIL_PASSWORD,
    MAIL_FROM       = MAIL_FROM,
    MAIL_FROM_NAME  = MAIL_FROM_NAME,
    MAIL_PORT       = MAIL_PORT,
    MAIL_SERVER     = MAIL_SERVER,
    MAIL_SSL_TLS    = MAIL_SSL_TLS,
    MAIL_STARTTLS   = MAIL_STARTTLS,
    USE_CREDENTIALS = True,
    VALIDATE_CERTS  = True,
)

_mailer = FastMail(_conf)


async def send_reset_email(to_email: str, token: str, user_name: str):
    reset_url = f"{APP_URL}/reset-password?token={token}"

    html = f"""
    <!DOCTYPE html>
    <html lang="es">
    <head><meta charset="utf-8"/></head>
    <body style="margin:0;padding:0;background:#0d0d0d;font-family:'DM Sans',Arial,sans-serif;">
      <div style="max-width:480px;margin:40px auto;background:#161616;
                  border:1px solid rgba(201,168,76,.3);border-radius:18px;overflow:hidden;">

        <!-- Header -->
        <div style="background:linear-gradient(135deg,#1a1500,#161616);
                    padding:28px 32px;border-bottom:1px solid rgba(201,168,76,.2);">
          <div style="font-size:24px;font-weight:800;color:#C9A84C;letter-spacing:-1px;">
            WBill<span style="color:#F5F0E8;">$</span>
          </div>
          <div style="font-size:11px;color:#8B8070;margin-top:2px;">Your Money, Your Rules</div>
        </div>

        <!-- Body -->
        <div style="padding:32px;">
          <div style="font-size:18px;font-weight:700;color:#F5F0E8;margin-bottom:8px;">
            🔐 Restablecer contraseña
          </div>
          <div style="font-size:14px;color:#8B8070;line-height:1.6;margin-bottom:24px;">
            Hola <strong style="color:#F5F0E8;">{user_name}</strong>, recibimos una solicitud
            para restablecer la contraseña de tu cuenta WBill$.
            <br/><br/>
            Haz clic en el botón para crear una nueva contraseña.
            Este enlace expira en <strong style="color:#C9A84C;">30 minutos</strong>.
          </div>

          <!-- Botón -->
          <div style="text-align:center;margin:28px 0;">
            <a href="{reset_url}"
               style="display:inline-block;padding:14px 36px;
                      background:linear-gradient(135deg,#8B6914,#C9A84C);
                      color:#0d0d0d;font-weight:700;font-size:15px;
                      border-radius:10px;text-decoration:none;letter-spacing:.3px;">
              Cambiar mi contraseña
            </a>
          </div>

          <!-- URL de respaldo -->
          <div style="font-size:11px;color:#8B8070;text-align:center;
                      word-break:break-all;margin-top:12px;">
            Si el botón no funciona, copia este enlace en tu navegador:<br/>
            <span style="color:#C9A84C;">{reset_url}</span>
          </div>
        </div>

        <!-- Footer -->
        <div style="padding:16px 32px;border-top:1px solid rgba(201,168,76,.1);
                    font-size:11px;color:#8B8070;text-align:center;">
          Si no solicitaste este cambio, ignora este correo. Tu cuenta está segura.<br/>
          WBill$ © 2026 — Control de gastos personales
        </div>
      </div>
    </body>
    </html>
    """

    message = MessageSchema(
        subject="🔐 Restablecer tu contraseña — WBill$",
        recipients=[to_email],
        body=html,
        subtype=MessageType.html
    )

    await _mailer.send_message(message)
