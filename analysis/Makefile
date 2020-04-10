.PHONY: always all

all: txt/res.tsv

txt/datastring.json: always
	psql $(shell heroku config:get DATABASE_URL)  -AtF'	' -c "select datastring  from cardturk" | mkifdiff $@

txt/res-raw.tsv: txt/datastring.json 
	./datastring2tsv.bash $< > $@
txt/res.tsv: txt/res-raw.tsv
	./readraw.R < $< > $@
