/************************************************************************************/
/* XOR.c                                                                            */
/*                                                                                  */
/*   This is an implementation of a dynamic optimization problem (DOP) generator    */
/*   based on the the exclusive-or (XOR) operator in C code. In fact, it is         */
/*   embeded in a framework of binary-encoded evolutionary algorithm for DOPs       */
/*                                                                                  */
/*   For further information about the XOR DOP generator, see the following papers: */
/*                                                                                  */
/*     1. S. Yang. Non-stationary problem optimization using the primal-dual        */
/*        genetic algorithm. Proceedings of the 2003 IEEE Congress on Evolutionary  */
/*        Computation, Vol. 3, pp. 2246-2253, 2003 (DOI: 10.1109/CEC.2003.1299951). */
/*                                                                                  */
/*     2. S. Yang and X. Yao. Experimental study on population-based incremental    */ 
/*        learning algorithms for dynamic optimization problems. Soft Computing,    */
/*        9(11): 815-834, 2005. Springer (DOI: 10.1007/s00500-004-0422-3).          */
/*                                                                                  */
/*     3. S. Yang and X. Yao. Population-based incremental learning with            */
/*        associative memory for dynamic environments. IEEE Transactions on         */
/*        Evolutionary Computation, 12(5): 542-561, October 2008. IEEE Press        */
/*        (DOI: 10.1109/TEVC.2007.913070).                                          */
/*                                                                                  */
/* Written by:                                                                      */  
/*                                                                                  */
/*   Shengxiang Yang, September 2005, University of Leicester, UK                   */  
/*                                                                                  */
/************************************************************************************/

#include <stdlib.h>
#include <math.h>

/* Change any of these parameters to match your needs */
#define NGENES 100        // number of genes in a binary chromosome
#define MAXBASESTATES 20  // max number of base states for cyclic environments
#define POPSIZE 100       // pop size

int changeMode = 1; // how environment changes, cyclic or not
                    //    1: cyclic, 2: cyclic with noise, 3: non-cyclic (random)

double changeRatio=0.5;  // the ratio of loci changed in dynamic environment
int changePeriod = 10;   // the period of environment changing in generations
int totalChanges = 100;  // the total number of environment changes in a run
int xorMask[NGENES];     // the mask for XORing environment
int baseXORMasks[MAXBASESTATES][NGENES]; // max base XOR masks for cyclic environment
bool bRandRatio = false; // whether changeRatio is random or not (default to false)
int totalBaseXORMasks =10; // actual number of base XOR masks (half of base states)
double pBaseMut = 0.05;  // probability of mutating each element of a base XOR mask 
                         //   for cyclic environments with noise
int currentGenNo=0;      // current generation no

struct genotype {         // genotype, a member of the population
  int gene[NGENES];       
  int phenoGene[NGENES];  // phenotype allele for dynamic environment
  double fitness;         // phenotype fitness
};

struct genotype pop[POPSIZE];     // population

/***********************************************************/
/* Random bit generator: Generates a random binary bit     */
/***********************************************************/
int randBit(void) { return (rand()%2); }

/***********************************************************/
/* Random value generator: Generates a value within bounds */
/***********************************************************/
double randNumber(double low, double high) {
  return ((double)(rand()%10000)/10000.0)*(high - low) + low;
}

/***********************************************************/
/* Random sequence generator:                              */
/*   Generates a random sequence of seqSize numbers from   */
/*   the natural number array [0, 1, ..., numSize-1]       */
/***********************************************************/
void randomSequence(int* seqArr, int seqSize, int numSize) {
  int i, j, idx, count, numleft;

  // constructs a natural number array
  int number[numSize];
  for (i=0; i<numSize; ++i) number[i] = i; 

  // select seqSize numbers from number[] without repeat
  numleft = numSize;
  for (i=0; i<seqSize; ++i) { 
    idx = rand() % numleft;
    count = 0;
    for (j=0; j<numSize; ++j) { 
      if (number[j] != -1) // found one not selected number
        ++count;

      if (count > idx) break; // found the idx-th not selected number
    }

    seqArr[i] = number[j];
    number[j] = -1; // marked as selected
    --numleft;
  }
}

/*********************************************************/
/* My Function: Here the dynamic OneMax function is used */
/*********************************************************/
void MyFunction(int idx) {
  int i;
  for (i=0; i<NGENES; ++i) // perform XOR operation
    pop[idx].phenoGene[i] = pop[idx].gene[i] ^ xorMask[i];

  pop[idx].fitness = 0.0;
  for (i=0; i<NGENES; ++i)
    pop[idx].fitness += pop[idx].phenoGene[i];
}


/***************************************************/
/* Evaluate the population                         */
/***************************************************/
void evaluatePop() {
  for (int i=0; i<POPSIZE; ++i) 
    MyFunction(i);
}

/********************************************************/
/* Environment Dynamics Function: Construct base XOR    */
/* masks for cyclic environments with or without noise  */
/********************************************************/
void constructBaseXORMasks(void) {
  int i, j, numOnes;
  int randIndex[NGENES];

  // create a random permutation of 0 to NGENES-1
  randomSequence(randIndex, NGENES, NGENES);

  // initialize the baseXORMasks
  for (i=0; i<totalBaseXORMasks; ++i)
    for (j=0; j<NGENES; ++j) baseXORMasks[i][j] = 0;

  // configure the baseXORMasks
  numOnes = (int)(changeRatio * NGENES);
  for (i=0; i<totalBaseXORMasks; ++i) {
    for (j=0; j<numOnes; ++j)
      baseXORMasks[i][randIndex[numOnes*i+j]] = 1; 
  }
}

/*******************************************************/
/* Environment Dynamics Function: Incremental changing */
/*******************************************************/
void changeEnvironment(void) {
  int i, j, numOnes, baseStateIdx;
  int interimTemplate[NGENES];  // interim binary template

  // initialize interimTemplate to a zero vector
  for (i=0; i<NGENES; ++i) interimTemplate[i] = 0; 

  if (bRandRatio == true)
    changeRatio = randNumber(0.01, 0.99);

  numOnes = (int)(changeRatio * NGENES);

  switch(changeMode) {
    case 1: // cyclic environments
      baseStateIdx = ((int)(currentGenNo/changePeriod))%totalBaseXORMasks;
      for (i=0; i<NGENES; ++i)  // copy the relevant base XOR mask 
        interimTemplate[i] = baseXORMasks[baseStateIdx][i];
      break;
    case 2: // cyclic environments with noise
      baseStateIdx = ((int)(currentGenNo/changePeriod))%totalBaseXORMasks;
      for (i=0; i<NGENES; ++i) // copy the relevant base XOR mask
        interimTemplate[i] = baseXORMasks[baseStateIdx][i];

      for (i=0; i<NGENES; ++i)
        if (randNumber(0.0, 1.0) < pBaseMut)
          interimTemplate[i] = 1 - interimTemplate[i];
      break;
    case 3: // random (non-cyclic) environments
      int index2[numOnes];
      randomSequence(index2, numOnes, NGENES);
      for (i=0; i<numOnes; ++i) // create numOnes 1's in interimTemplate
        interimTemplate[index2[i]] = 1;
      break;
  }

  for (i=0; i<NGENES; ++i) // integrate interimTemplate into xorMask
    xorMask[i] ^= interimTemplate[i];
}

/**********************************************/
/* Initializes the xorMask to a zero vector   */
/* that corresponds to stationary problem     */
/**********************************************/
void initialize() {
  if (changeMode == 1 || changeMode == 2) {
    if(changeRatio == 0.1)  totalBaseXORMasks = 10;
    if(changeRatio == 0.2)  totalBaseXORMasks = 5;
    if(changeRatio == 0.5)  totalBaseXORMasks = 2;
    if(changeRatio == 1.0)  totalBaseXORMasks = 1;
    constructBaseXORMasks();
  }

  for (int i = 0; i<NGENES; ++i)
    xorMask[i] = 0;

  // a lot more to do here
  // ......
}


/****************************************************************/
/* Main function: Each generation involves selection, crossover */
/* mutation until the terminating condition is satisfied. The   */
/* environment changes every changePeriod generations.          */
/****************************************************************/
int main(int argc, char *argv[]) {

  // you may take inputs from the command line for 
  // changeMode, changeRatio, and changePeriod
  changeMode = atoi(argv[1]);
  changeRatio = atof(argv[2]);
  changePeriod = atoi(argv[3]);
  if (changeRatio > 1.0) bRandRatio = true;
  else bRandRatio = false;

  initialize();
  currentGenNo = 1;
  while (currentGenNo <= changePeriod * totalChanges) {
    evaluatePop(); 

    /***************************************************

     **** put normal evolutionary algorithm here ****

    ***************************************************/

    if ((currentGenNo%changePeriod) == 0) // change environment
      changeEnvironment();

    currentGenNo++;
  }

  return 0;
}

/**************************** End *************************/
