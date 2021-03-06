import Parse from 'parse/node';

const maslenica = require('./maslenica.json');
const teplica = require('./teplica.json');
const pizzaBlues = require('./pizza-blues.json');
const faqJson = require('./faq.json');
const notifJson = require('./notification.json');

const SERVER_PORT = process.env.PORT || 8080;
const SERVER_URL = process.env.SERVER_URL || 'http://localhost';

Parse.initialize('oss-f8-app-2016');
Parse.serverURL = 'http://paul-server.herokuapp.com/parse' //`${SERVER_URL}:${SERVER_PORT}/parse`;


async function importClass(data) {
  console.log('Loading Store');
  const Store = Parse.Object.extend('Store');
  const Product = Parse.Object.extend('Product');

  console.log('Cleaning old', 'store, product', 'data');
  await new Parse.Query(Product)
    .each(record => record.destroy());
    
  await new Parse.Query(Store)
    .each(record => record.destroy());
  

  let sObj = new Store();
  sObj.set('title', data.title);
  sObj.set('hours', data.hours);
  sObj.set('phones', data.phones);
  sObj.set('image', data.image);
  sObj.set('enabled', true);
  sObj = await sObj.save();

  for (var i = 0; i < data.products.length; i++) {
    var p = data.products[i];
    let pObj = new Product();
    pObj.set('title', p.title);
    pObj.set('description', p.description);
    pObj.set('category', p.category);
    pObj.set('price', p.price);
    pObj.set('otherPrice', p.otherPrice);
    pObj.set('image', p.image);
    pObj.set('store', sObj);
    pObj = await pObj.save();
  }
}

async function importFaq(data) {
  console.log('Loading Faq');
  const Faq = Parse.Object.extend('Faq');

  console.log('Cleaning old', 'faq');

  await new Parse.Query(Faq)
    .each(record => record.destroy());

  for (var i = 0; i < data.length; i++) {
    var p = data[i];
    let pObj = new Faq();
    pObj.set('answer', p.answer);
    pObj.set('question', p.question);
    pObj = await pObj.save();
  }
}

async function importNotification(data) {
  console.log('Loading Notification');
  const Notification = Parse.Object.extend('Notification');

  console.log('Cleaning old', 'Notification');

  await new Parse.Query(Notification)
    .each(record => record.destroy());

  for (var i = 0; i < data.length; i++) {
    var p = data[i];
    let pObj = new Notification();
    pObj.set('text', p.text);
    if (p.url) {
       pObj.set('text', p.text);
    }
    if (p.image) {
       pObj.set('image', p.image);
    }
    pObj = await pObj.save();
  }
}

async function main() {
  await Promise.all([
    importClass(maslenica),
    importClass(teplica),
    importClass(pizzaBlues),
    importFaq(faqJson),
    importNotification(notifJson),
  ]);
  return 'OK';
}

main()
  .then(console.dir, (a, b) => {
    console.log(a, b);
  });
