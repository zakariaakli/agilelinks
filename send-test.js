import sgMail from '@sendgrid/mail'

sgMail.setApiKey('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') // replace with your real key

const msg = {
  to: 'zakaria.akli.ensa@gmail.com', // ✅ use a real address you can check
  from: 'zakaria.akli.ensa@gmail.com', // ✅ must match a verified sender in SendGrid!
  subject: 'Test Email from SendGrid',
  html: '<strong>Hello from AgileLinks dev stack 👋</strong>',
}

sgMail
  .send(msg)
  .then(() => {
    console.log('✅ Email sent')
  })
  .catch((error) => {
    console.error('❌ Error sending email:', error)
  })
