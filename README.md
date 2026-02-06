# Atividade-Avaliativa

# Instruções de Execução


# Clone o repositório:
git clone [url-do-repositorio]
cd problema-institucional-api

# Configure as variáveis de ambiente:
cp .env.example .env
Edite o arquivo .env com suas configurações

# Instale as dependências:
npm install

# Suba o banco de dados com Docker:
docker-compose up -d postgres

# Execute as migrações:
npx prisma migrate dev

# Popule o banco com dados iniciais (opcional):
npx tsx scripts/seed.ts

# Inicie o servidor em desenvolvimento:
npm run dev

# Execute os testes:
npm test
