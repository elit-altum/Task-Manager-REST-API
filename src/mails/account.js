// For sending e-mails using SendGrid's API

const sgMail = require('@sendgrid/mail');

// SG's unique API provided at time of registrations 
// authenticates our account on SG
sgMail.setApiKey(process.env.SENDGRID_API_KEY);

const sendWelcomeEmail = (email, name) => {
    // fn to send email when a user signs up for an account
    const registerText = `Welcome to Task-It, ${name}.\nHow are things with you ?\nRegards,\nElit-Altum`;

    sgMail.send({
        to: email,
        from: 'management@task-it.com',
        subject: 'Welcome to Task-It',
        text: registerText
    });
}

const sendCancelEmail = (email, name) => {
    // fn to send email when a user signs up for an account
    const cancelText = `Sorry to see you go ${name} :( \nHow can we be better ?\nRegards,\nElit-Altum`;

    sgMail.send({
        to: email,
        from: 'management@task-it.com',
        subject: 'Welcome to Task-It',
        text: cancelText
    });
}

module.exports = {
    sendWelcomeEmail,
    sendCancelEmail
}