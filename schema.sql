CREATE TABLE orders(
  id serial primary key,
  name varchar(64) not null,
  email varchar(100)not null,
  ssn   char(11) not null,
  amount int not null,
  date timestamp with time zone not null default current_timestamp
);