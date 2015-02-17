# Sasha Heinen
# UBC Clinic

import sqlite3 as lite
import sys
import filterForRNAMov as rnaMov
import os

INTERESTINGNUMBER = 1
NUMBEROFFILTERS = 1

def formDatabase(fileName):

	# rnaMov.filterForStructs(fileName)

	f = open(fileName)
	f.readline() # strip the "header"
	f.readline()

	con = lite.connect('test.db')

	originalLines = 0
	finalLines = 0

	with con:
		cur = con.cursor()
		cur.execute("DROP TABLE IF EXISTS Pathway")
		cur.execute("CREATE TABLE Pathway(Strand TEXT, Count INT)")

		###### CREATE DB #######

		for line in f:
			line = line.strip()
			originalLines += 1

			cur.execute("SELECT * from Pathway WHERE Strand=(?)", (line,))
			line_exists = cur.fetchone()
			if line_exists:
				count = line_exists[1] + 1
				cur.execute("UPDATE Pathway SET Count=? WHERE Strand=?", (count, line))
			else:
				cur.execute("INSERT INTO Pathway VALUES ((?), 1)", (line,))

			con.commit()

		f.close()

		####### FILTER BY MOST COMMON STRUCTURE #######

		cur.execute('SELECT Strand FROM Pathway ORDER BY Count DESC LIMIT ?', (NUMBEROFFILTERS,))
		filters = cur.fetchall()
		tmp = None

		for i in range(NUMBEROFFILTERS):
			tmpfilename = 'tmpfile_'+str(i)
			tmp = open(tmpfilename, 'a')
			f = None
			if i == 0:
				f = open(fileName)
				f.readline()
				f.readline()
			else:
				f = open('tmpfile_'+str((i-1)))

			mostFreqConfig = filters[i][0]
			currentLoop = None

			#print "mf config is: " + str(mostFreqConfig)
			#print "writing line: "

			for line in f:
				line = line.strip()

				cur.execute("SELECT * from Pathway WHERE Strand=(?)", (line,))
				row = cur.fetchone()

				if (currentLoop != None) and (row[0] != mostFreqConfig):
					currentLoop += [row[0]]
				else:
					tmp.write(row[0] + '\n')

				# if we encounter the end of the loop
				if row[0] == mostFreqConfig:

					if currentLoop == None:
						currentLoop = [mostFreqConfig]
					else:
						for structure in currentLoop:
							cur.execute("SELECT * from Pathway WHERE Strand=(?)", (structure,))
							entry = cur.fetchone()
							if entry[1] <= INTERESTINGNUMBER:
								#print "writing to file"

								for structure in currentLoop:
									#print "writing line: " + structure
									tmp.write(structure + '\n')		

								break

						currentLoop = [mostFreqConfig]


			f.close()
			if i > 0:
				prevtmp = 'tmpfile_'+str(i-1)
				os.remove(prevtmp)

		finaltmp = 'tmpfile_'+str(NUMBEROFFILTERS-1)
		tmp = open(finaltmp, 'r')

		# copy final tmp file to the outFile
		outFile = open('remove_loops_'+fileName, 'w')

		for line in tmp.readlines():
			finalLines += 1
			outFile.write(line)

		outFile.close()
		tmp.close()
		os.remove(finaltmp)

	print "cut from " + str(originalLines) + " lines to " + str(finalLines)

	con.close()
	return



def main():
    argL = sys.argv
    formDatabase(argL[1])
    return

if __name__ == "__main__":
    main()
    