import { PrismaClient } from "@prisma/client"

const prisma = new PrismaClient();

async function main() {
  try{
    await prisma.exercise.deleteMany()
    const result = await prisma.workout.deleteMany()
  }catch(error){
    console.log(error)
  }
}

main()
  .then(async () => {
    await prisma.$disconnect()
  })
  .catch(async (e) => {
    console.error(e)
    await prisma.$disconnect()
  })