-- Push notification subscriptions (Web Push API)
create table push_subscriptions (
  id uuid primary key default gen_random_uuid(),
  endpoint text not null unique,
  keys_p256dh text not null,
  keys_auth text not null,
  user_id uuid references auth.users(id) on delete cascade,
  created_at timestamptz not null default now()
);

alter table push_subscriptions enable row level security;

create policy "Anyone can subscribe"
  on push_subscriptions for insert
  with check (true);

create policy "Users can delete own subscription"
  on push_subscriptions for delete
  using (user_id = auth.uid());
