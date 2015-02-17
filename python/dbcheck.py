import sqlite3 as lite
import sys

con = lite.connect('test.db')

with con:
    
    cur = con.cursor()    
    cur.execute('SELECT * FROM PATHWAY')
    
    col_names = [cn[0] for cn in cur.description]
    
    rows = cur.fetchall()

    for row in rows:    
        print "%2s %-10s %-10s" % row
