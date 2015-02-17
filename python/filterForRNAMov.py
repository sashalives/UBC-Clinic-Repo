# Rachel Sherman
# October 4, 2014
# UBC Clinic

import sys

def filterForStructs(fileName):

    f = open(fileName)
    f.readline() # Strip first two lines
    header = f.readline().strip()
    seq = f.readline().strip()[2:] #3rd line is seq

    outFile = open('filtered_'+fileName, 'w')
    outFile.write('> '+header+'\n')
    outFile.write(seq+'\n')
    
    for line in f:
        line = line.strip()
        if line[2] == '.' or line[2] == '(':
            outFile.write(line[2:]+'\n')
            
    outFile.close()
    f.close()
    return

def main():
    argL = sys.argv
    filterForStructs(argL[1])
    return

if __name__ == "__main__":
    main()
