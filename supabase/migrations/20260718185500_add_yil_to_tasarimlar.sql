alter table public.tasarimlar
  add column if not exists yil integer;

comment on column public.tasarimlar.yil is
  'Tasarımın yayın veya üretim yılı';

notify pgrst, 'reload schema';
