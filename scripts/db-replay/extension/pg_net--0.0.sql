create schema if not exists net;
create table net.stub_requests (id bigserial primary key, url text, headers jsonb, body jsonb);
create function net.http_post(url text, body jsonb default '{}'::jsonb, params jsonb default '{}'::jsonb,
  headers jsonb default '{}'::jsonb, timeout_milliseconds integer default 5000)
returns bigint language sql as $$ insert into net.stub_requests(url, headers, body) values (url, headers, body) returning id $$;
